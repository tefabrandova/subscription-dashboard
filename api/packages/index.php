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

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            $query = "SELECT * FROM packages ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $packages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert JSON fields
            foreach ($packages as &$package) {
                $package['details'] = json_decode($package['details'], true);
                $package['price'] = json_decode($package['price'], true);
            }
            
            echo json_encode(['success' => true, 'data' => $packages]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            $query = "INSERT INTO packages (id, account_id, type, name, details, price, subscribed_customers, user_id) 
                     VALUES (:id, :account_id, :type, :name, :details, :price, :subscribed_customers, :user_id)";
            
            $stmt = $db->prepare($query);
            $id = uniqid('pkg_', true);
            
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':account_id', $input['accountId']);
            $stmt->bindParam(':type', $input['type']);
            $stmt->bindParam(':name', $input['name']);
            $stmt->bindParam(':details', json_encode($input['details']));
            $stmt->bindParam(':price', json_encode($input['price']));
            $stmt->bindParam(':subscribed_customers', $input['subscribedCustomers']);
            $stmt->bindParam(':user_id', $userId);
            
            $stmt->execute();
            
            // Update linked packages count
            $updateQuery = "UPDATE accounts SET linked_packages = linked_packages + 1 WHERE id = :account_id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':account_id', $input['accountId']);
            $updateStmt->execute();
            
            // Log activity
            $logQuery = "INSERT INTO activity_logs (user_id, action_type, object_type, object_id, object_name, details) 
                        VALUES (:user_id, 'create', 'package', :object_id, :object_name, :details)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->bindParam(':user_id', $userId);
            $logStmt->bindParam(':object_id', $id);
            $logStmt->bindParam(':object_name', $input['name']);
            $logStmt->bindParam(':details', "Created new package: " . $input['name']);
            $logStmt->execute();
            
            echo json_encode(['success' => true, 'id' => $id]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $packageId = $_GET['id'] ?? null;
        
        if (!$packageId) {
            http_response_code(400);
            echo json_encode(['error' => 'Package ID is required']);
            exit();
        }
        
        try {
            $query = "UPDATE packages SET account_id = :account_id, type = :type, name = :name, 
                     details = :details, price = :price, subscribed_customers = :subscribed_customers 
                     WHERE id = :id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $packageId);
            $stmt->bindParam(':account_id', $input['accountId']);
            $stmt->bindParam(':type', $input['type']);
            $stmt->bindParam(':name', $input['name']);
            $stmt->bindParam(':details', json_encode($input['details']));
            $stmt->bindParam(':price', json_encode($input['price']));
            $stmt->bindParam(':subscribed_customers', $input['subscribedCustomers']);
            
            $stmt->execute();
            
            // Log activity
            $logQuery = "INSERT INTO activity_logs (user_id, action_type, object_type, object_id, object_name, details) 
                        VALUES (:user_id, 'update', 'package', :object_id, :object_name, :details)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->bindParam(':user_id', $userId);
            $logStmt->bindParam(':object_id', $packageId);
            $logStmt->bindParam(':object_name', $input['name']);
            $logStmt->bindParam(':details', "Updated package: " . $input['name']);
            $logStmt->execute();
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        $packageId = $_GET['id'] ?? null;
        
        if (!$packageId) {
            http_response_code(400);
            echo json_encode(['error' => 'Package ID is required']);
            exit();
        }
        
        try {
            // Get package info for logging
            $infoQuery = "SELECT name, account_id FROM packages WHERE id = :id";
            $infoStmt = $db->prepare($infoQuery);
            $infoStmt->bindParam(':id', $packageId);
            $infoStmt->execute();
            $package = $infoStmt->fetch(PDO::FETCH_ASSOC);
            
            // Delete package
            $query = "DELETE FROM packages WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $packageId);
            $stmt->execute();
            
            // Update linked packages count
            if ($package) {
                $updateQuery = "UPDATE accounts SET linked_packages = GREATEST(0, linked_packages - 1) WHERE id = :account_id";
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->bindParam(':account_id', $package['account_id']);
                $updateStmt->execute();
                
                // Log activity
                $logQuery = "INSERT INTO activity_logs (user_id, action_type, object_type, object_id, object_name, details) 
                            VALUES (:user_id, 'delete', 'package', :object_id, :object_name, :details)";
                $logStmt = $db->prepare($logQuery);
                $logStmt->bindParam(':user_id', $userId);
                $logStmt->bindParam(':object_id', $packageId);
                $logStmt->bindParam(':object_name', $package['name']);
                $logStmt->bindParam(':details', "Deleted package: " . $package['name']);
                $logStmt->execute();
            }
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>