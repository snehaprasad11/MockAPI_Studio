USE mockapi_studio;

INSERT INTO users (name, email, password_hash)
VALUES (
    'Demo User',
    'demo@mockapi.local',
    'demo-salt:adc99123e27b22d0ad30de95dd402298a855f075cffff237bd448bc9d25cf5f9ba8afb3427cedefdaa162a4d86331da1f323f88fdbef0afd8082b8772faf93f2'
);

INSERT INTO workspaces (user_id, name, slug, description)
VALUES (
    1,
    'Demo Store',
    'demo-store',
    'Mock endpoints for an ecommerce storefront prototype.'
);

INSERT INTO endpoints (
    workspace_id,
    method,
    path,
    name,
    description,
    status_code,
    response_body
)
VALUES
(
    1,
    'GET',
    '/products',
    'List products',
    'Returns product cards for the storefront home page.',
    200,
    JSON_ARRAY(
        JSON_OBJECT('id', 1, 'name', 'Launch Kit', 'price', 49, 'inStock', true),
        JSON_OBJECT('id', 2, 'name', 'Design System Pack', 'price', 79, 'inStock', true)
    )
),
(
    1,
    'GET',
    '/orders/1001',
    'Get order detail',
    'Returns a single order summary for account pages.',
    200,
    JSON_OBJECT(
        'id', 1001,
        'status', 'shipped',
        'total', 128,
        'items', JSON_ARRAY('Launch Kit', 'Design System Pack')
    )
);
