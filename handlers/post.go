package handlers

import (
	"encoding/json"
	"go/rest-ws/models"
	"go/rest-ws/repository"
	"go/rest-ws/server"
	"go/rest-ws/utils"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/segmentio/ksuid"
)

type InsertPostRequest struct {
	Content string `json:"content"`
}

type PostResponse struct {
	Id      string `json:"id"`
	Content string `json:"content"`
	UserId  string `json:"user_id"`
}

type UpdatePostRequest struct {
	Message string `json:"message"`
}

func InsertPostHandler(s server.Server) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := utils.GetUserFromToken(r, s.Config().JWTSecret)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		var req InsertPostRequest
		err = json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		id, err := ksuid.NewRandom()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		post := models.Post{
			Id:      id.String(),
			Content: req.Content,
			UserId:  user.Id,
		}

		err = repository.InsertPost(r.Context(), &post)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(PostResponse{
			Id:      post.Id,
			Content: post.Content,
			UserId:  post.UserId,
		})
	}
}

func GetPostByIdHandler(s server.Server) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		params := mux.Vars(r)
		id := params["id"]
		if id == "" {
			http.Error(w, "id is required", http.StatusBadRequest)
			return
		}

		post, err := repository.GetPostById(r.Context(), id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(post)
	}
}

func UpdatePostHandler(s server.Server) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claimedUser, err := utils.GetUserFromToken(r, s.Config().JWTSecret)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		params := mux.Vars(r)
		id := params["id"]
		if id == "" {
			http.Error(w, "id is required", http.StatusBadRequest)
			return
		}

		var req InsertPostRequest
		err = json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		post := models.Post{
			Id:      id,
			Content: req.Content,
			UserId:  claimedUser.Id,
		}

		err = repository.UpdatePost(r.Context(), &post)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(UpdatePostRequest{
			Message: "Post updated successfully",
		})
	}
}

func DeletePostHandler(s server.Server) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claimedUser, err := utils.GetUserFromToken(r, s.Config().JWTSecret)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		params := mux.Vars(r)
		id := params["id"]
		if id == "" {
			http.Error(w, "id is required", http.StatusBadRequest)
			return
		}

		err = repository.DeletePost(r.Context(), id, claimedUser.Id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(UpdatePostRequest{
			Message: "Post deleted successfully",
		})
	}
}

func ListPostsHandler(s server.Server) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page, err := strconv.ParseUint(r.URL.Query().Get("page"), 10, 64)
		if err != nil {
			http.Error(w, "page is required", http.StatusBadRequest)
			return
		}

		posts, err := repository.ListPosts(r.Context(), page)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)
	}
}
