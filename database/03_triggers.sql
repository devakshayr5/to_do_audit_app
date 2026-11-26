-- 03_triggers.sql : AFTER INSERT / UPDATE / DELETE triggers on todos
-- Run with the mysql client (it understands DELIMITER), e.g.
--   mysql -u root -p < database/03_triggers.sql
USE todo_app;

DROP TRIGGER IF EXISTS trg_todos_after_insert;
DROP TRIGGER IF EXISTS trg_todos_after_update;
DROP TRIGGER IF EXISTS trg_todos_after_delete;

DELIMITER $$

-- @app_user is a MySQL session variable set by the Node.js app before each write.
-- If it is missing (e.g. someone edits the table directly in MySQL Workbench)
-- we fall back to the database login, so "changed_by" is never empty.

CREATE TRIGGER trg_todos_after_insert
AFTER INSERT ON todos
FOR EACH ROW
BEGIN
  INSERT INTO todo_audit (todo_id, action, old_values, new_values, changed_by)
  VALUES (
    NEW.id,
    'INSERT',
    NULL,
    JSON_OBJECT('title', NEW.title, 'description', NEW.description,
                'status', NEW.status, 'due_date', NEW.due_date),
    COALESCE(@app_user, CONCAT('db:', CURRENT_USER()))
  );
END$$

CREATE TRIGGER trg_todos_after_update
AFTER UPDATE ON todos
FOR EACH ROW
BEGIN
  -- <=> is the NULL-safe "equals". Only log if a tracked column really changed.
  IF NOT (OLD.title       <=> NEW.title
      AND OLD.description <=> NEW.description
      AND OLD.status      <=> NEW.status
      AND OLD.due_date    <=> NEW.due_date) THEN
    INSERT INTO todo_audit (todo_id, action, old_values, new_values, changed_by)
    VALUES (
      NEW.id,
      'UPDATE',
      JSON_OBJECT('title', OLD.title, 'description', OLD.description,
                  'status', OLD.status, 'due_date', OLD.due_date),
      JSON_OBJECT('title', NEW.title, 'description', NEW.description,
                  'status', NEW.status, 'due_date', NEW.due_date),
      COALESCE(@app_user, CONCAT('db:', CURRENT_USER()))
    );
  END IF;
END$$

CREATE TRIGGER trg_todos_after_delete
AFTER DELETE ON todos
FOR EACH ROW
BEGIN
  INSERT INTO todo_audit (todo_id, action, old_values, new_values, changed_by)
  VALUES (
    OLD.id,
    'DELETE',
    JSON_OBJECT('title', OLD.title, 'description', OLD.description,
                'status', OLD.status, 'due_date', OLD.due_date),
    NULL,
    COALESCE(@app_user, CONCAT('db:', CURRENT_USER()))
  );
END$$

DELIMITER ;
