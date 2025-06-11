<?php
function authenticateUser() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        exit();
    }
    
    $token = $matches[1];
    $decoded = base64_decode($token);
    $parts = explode(':', $decoded);
    
    if (count($parts) !== 2) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit();
    }
    
    $userId = $parts[0];
    $timestamp = $parts[1];
    
    // Check if token is not older than 24 hours
    if (time() - $timestamp > 86400) {
        http_response_code(401);
        echo json_encode(['error' => 'Token expired']);
        exit();
    }
    
    return $userId;
}

function getCurrentUser($db, $userId) {
    $query = "SELECT id, name, email, role, created_at, last_login FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();
    
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
?>