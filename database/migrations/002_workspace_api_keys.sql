USE mockapi_studio;

SET @add_api_key_enabled = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE workspaces ADD COLUMN api_key_enabled BOOLEAN NOT NULL DEFAULT FALSE',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'workspaces'
      AND COLUMN_NAME = 'api_key_enabled'
);
PREPARE stmt FROM @add_api_key_enabled;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_api_key_prefix = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE workspaces ADD COLUMN api_key_prefix VARCHAR(24)',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'workspaces'
      AND COLUMN_NAME = 'api_key_prefix'
);
PREPARE stmt FROM @add_api_key_prefix;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_api_key_hash = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE workspaces ADD COLUMN api_key_hash VARCHAR(128)',
        'SELECT 1'
    )
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'workspaces'
      AND COLUMN_NAME = 'api_key_hash'
);
PREPARE stmt FROM @add_api_key_hash;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
