DROP DATABASE IF EXISTS mockapi_studio;
CREATE DATABASE mockapi_studio;
USE mockapi_studio;

CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspaces (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    name VARCHAR(140) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_workspaces_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE endpoints (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workspace_id BIGINT NOT NULL,
    method ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE') NOT NULL,
    path VARCHAR(255) NOT NULL,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    status_code INT NOT NULL DEFAULT 200,
    response_delay_ms INT NOT NULL DEFAULT 0,
    response_body JSON NOT NULL,
    error_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    error_status_code INT NOT NULL DEFAULT 500,
    error_body JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_endpoint_route (workspace_id, method, path),
    CONSTRAINT fk_endpoints_workspace
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
        ON DELETE CASCADE
);

CREATE TABLE request_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    endpoint_id BIGINT,
    workspace_slug VARCHAR(160) NOT NULL,
    method VARCHAR(12) NOT NULL,
    path VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    request_body JSON,
    response_body JSON,
    ip_address VARCHAR(80),
    user_agent VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_request_logs_endpoint (endpoint_id),
    INDEX idx_request_logs_workspace (workspace_slug, created_at),
    CONSTRAINT fk_logs_endpoint
        FOREIGN KEY (endpoint_id) REFERENCES endpoints(id)
        ON DELETE SET NULL
);
