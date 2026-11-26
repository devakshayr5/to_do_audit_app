-- 01_schema.sql : creates the database and the main "todos" table
CREATE DATABASE IF NOT EXISTS todo_app
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE todo_app;

CREATE TABLE IF NOT EXISTS todos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title       VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status      ENUM('pending', 'completed') NOT NULL DEFAULT 'pending',
  due_date    DATE NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- MySQL refreshes this column automatically on every UPDATE
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_todos_status (status)
) ENGINE=InnoDB;
