package server

import (
	"context"
	"errors"
	"go/rest-ws/database"
	"go/rest-ws/repository"
	"go/rest-ws/websocket"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

type Config struct {
	Port        string
	JWTSecret   string
	DatabaseURL string
}

type Server interface {
	Config() *Config
	Hub() *websocket.Hub
}

type Broker struct {
	config *Config
	hub    *websocket.Hub
	router *mux.Router
}

func (broker *Broker) Config() *Config {
	return broker.config
}

func (broker *Broker) Hub() *websocket.Hub {
	return broker.hub
}

func ValidateConfig(config *Config) error {
	if config.Port == "" {
		return errors.New("port is required")
	}
	if config.JWTSecret == "" {
		return errors.New("jwtSecret is required")
	}
	if config.DatabaseURL == "" {
		return errors.New("databaseURL is required")
	}
	return nil
}

func NewServer(ctx context.Context, config *Config) (*Broker, error) {
	if err := ValidateConfig(config); err != nil {
		return nil, err
	}

	return &Broker{
		config: config,
		router: mux.NewRouter(),
		hub:    websocket.NewHub(),
	}, nil
}

func (broker *Broker) Start(binder func(server Server, router *mux.Router)) {
	broker.router = mux.NewRouter()
	binder(broker, broker.router)

	handlerCors := cors.AllowAll().Handler(broker.router)

	repo, err := database.NewPostgresRepository(broker.config.DatabaseURL)
	if err != nil {
		log.Fatal(">> Error creating repository: ", err)
	}

	go broker.hub.Run()

	repository.SetRepository(repo)

	log.Println(">> Starting server on port: ", broker.config.Port)

	if err := http.ListenAndServe(broker.config.Port, handlerCors); err != nil {
		log.Fatal(">> Error starting server: ", err)
	}
}
