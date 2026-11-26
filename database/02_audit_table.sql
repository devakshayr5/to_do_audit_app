-- 02_audit_table.sql : the audit (history) table
USE todo_app;

CREATE TABLE IF NOT EXISTS todo_audit (
  audit_id   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- NOTE: deliberately NOT a foreign key. When a todo is deleted we still
  -- want to keep its history, and an FK would block (or cascade-delete) it.
  todo_id    INT UNSIGNED NOT NULL,
  action     ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  old_values JSON NULL,          -- NULL for INSERT
  new_values JSON NULL,          -- NULL for DELETE
  changed_by VARCHAR(100) NOT NULL,
  changed_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),  -- millisecond precision
  PRIMARY KEY (audit_id),
  INDEX idx_audit_todo (todo_id, changed_at)
) ENGINE=InnoDB;
