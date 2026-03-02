package database

import (
	"context"
	"database/sql"
	"go/rest-ws/models"
	"log"

	_ "github.com/lib/pq"
)

type PostgresRepository struct {
	db *sql.DB
}

func NewPostgresRepository(url string) (*PostgresRepository, error) {
	db, err := sql.Open("postgres", url)
	if err != nil {
		return nil, err
	}
	return &PostgresRepository{db}, nil
}

func (repo *PostgresRepository) InsertUser(ctx context.Context, user *models.User) error {
	_, err := repo.db.ExecContext(
		ctx,
		"INSERT INTO users (id, email, password) VALUES ($1, $2, $3)",
		user.Id,
		user.Email,
		user.Password,
	)
	return err
}

func (repo *PostgresRepository) InsertPost(ctx context.Context, post *models.Post) error {
	_, err := repo.db.ExecContext(
		ctx,
		"INSERT INTO posts (id, content, user_id) VALUES ($1, $2, $3)",
		post.Id,
		post.Content,
		post.UserId,
	)
	return err
}

func (repo *PostgresRepository) GetUserById(ctx context.Context, id string) (*models.User, error) {
	row := repo.db.QueryRowContext(
		ctx,
		"SELECT id, email FROM users WHERE id = $1",
		id,
	)
	var user models.User
	err := row.Scan(&user.Id, &user.Email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (repo *PostgresRepository) GetPostById(ctx context.Context, id string) (*models.Post, error) {
	row := repo.db.QueryRowContext(
		ctx,
		"SELECT id, content, created_at, user_id FROM posts WHERE id = $1",
		id,
	)
	var post models.Post
	err := row.Scan(&post.Id, &post.Content, &post.CreatedAt, &post.UserId)
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (repo *PostgresRepository) UpdatePost(ctx context.Context, post *models.Post) error {
	_, err := repo.db.ExecContext(
		ctx,
		"UPDATE posts SET content = $1 WHERE id = $2 and user_id = $3",
		post.Content,
		post.Id,
		post.UserId,
	)
	return err
}

func (repo *PostgresRepository) DeletePost(ctx context.Context, id string, userId string) error {
	_, err := repo.db.ExecContext(
		ctx,
		"DELETE FROM posts WHERE id = $1 and user_id = $2",
		id,
		userId,
	)
	return err
}

func (repo *PostgresRepository) ListPosts(ctx context.Context, page uint64) ([]models.Post, error) {
	const QUERY_LIMIT = 20

	rows, err := repo.db.QueryContext(
		ctx,
		"SELECT id, content, created_at, user_id FROM posts ORDER BY created_at DESC LIMIT $1 OFFSET $2",
		QUERY_LIMIT,
		(page-1)*QUERY_LIMIT,
	)
	if err != nil {
		return nil, err
	}
	defer func() {
		err = rows.Close()
		if err != nil {
			log.Fatal(err)
		}
	}()
	posts := []models.Post{}
	for rows.Next() {
		var post models.Post
		err := rows.Scan(&post.Id, &post.Content, &post.CreatedAt, &post.UserId)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return posts, nil
}

func (repo *PostgresRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	row := repo.db.QueryRowContext(
		ctx,
		"SELECT id, email, password FROM users WHERE email = $1",
		email,
	)
	var user models.User
	err := row.Scan(&user.Id, &user.Email, &user.Password)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (repo *PostgresRepository) Close() error {
	return repo.db.Close()
}
