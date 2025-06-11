<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../auth/middleware.php';

$database = new Database();
$db = $database->getConnection();

// Check if database connection is valid
if ($db === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

$userId = authenticateUser();
$user = getCurrentUser($db, $userId);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $query = "SELECT al.*, u.name as user_name, u.role as user_role 
              FROM activity_logs al 
              LEFT JOIN users u ON al.user_id = u.id 
              ORDER BY al.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format logs for frontend
    $formattedLogs = [];
    foreach ($logs as $log) {
        $formattedLogs[] = [
            'id' => $log['id'],
            'userId' => $log['user_id'],
            'userName' => $log['user_name'] ?? 'Unknown User',
            'userRole' => $log['user_role'] ?? 'user',
            'actionType' => $log['action_type'],
            'objectType' => $log['object_type'],
            'objectId' => $log['object_id'],
            'objectName' => $log['object_name'],
            'details' => $log['details'],
            'timestamp' => $log['created_at']
        ];
    }
    
    echo json_encode(['success' => true, 'data' => $formattedLogs]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>