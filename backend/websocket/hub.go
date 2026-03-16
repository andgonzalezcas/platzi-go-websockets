package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Hub struct {
	clients    []*Client
	register   chan *Client
	unregister chan *Client
	mutex      *sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make([]*Client, 0),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		mutex:      &sync.Mutex{},
	}
}

func (hub *Hub) HandleWebsocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		http.Error(w, "Could not open websocker connection", http.StatusInternalServerError)
		return
	}

	client := NewClient(hub, conn)
	hub.register <- client

	go client.Write()
}

func (hub *Hub) Run() {
	for {
		select {
		case client := <-hub.register:
			hub.onConnect(client)
		case client := <-hub.unregister:
			hub.onDisconnect(client)
		}
	}
}

func (hub *Hub) onConnect(client *Client) {
	log.Println(">> Client connected: ", client.socket.RemoteAddr())

	hub.mutex.Lock()
	defer hub.mutex.Unlock()

	client.id = client.socket.RemoteAddr().String()
	hub.clients = append(hub.clients, client)
}

func (hub *Hub) onDisconnect(client *Client) {
	log.Println("<< Client disconnected: ", client.socket.RemoteAddr())
	client.socket.Close()

	hub.mutex.Lock()
	defer hub.mutex.Unlock()

	targetIndex := -1
	for i, c := range hub.clients {
		if c.id == client.id {
			targetIndex = i
			break
		}
	}

	if targetIndex != -1 {
		copy(hub.clients[targetIndex:], hub.clients[targetIndex+1:])
		hub.clients[len(hub.clients)-1] = nil
		hub.clients = hub.clients[:len(hub.clients)-1]
	}
}

func (hub *Hub) Broadcast(message any, ignore *Client) {
	data, _ := json.Marshal(message)

	for _, client := range hub.clients {
		if ignore != nil && client.id == ignore.id {
			continue
		}
		client.outbound <- data
	}
}
