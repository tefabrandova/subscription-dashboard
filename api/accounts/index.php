<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../auth/middleware.php';

$database = new Database();
$db = $database->getConnection();
$userId = authenticateUser();
$user = getCurrentUser($db, $userId);

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        try {
            $query = "SELECT * FROM accounts ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert JSON fields
            foreach ($accounts as &$account) {
                $account['details'] = json_decode($account['details'], true);
                $account['price'] = json_decode($account['price'], true);
            }
            
            echo json_encode(['success' => true, 'data' => $accounts]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            $query = "INSERT INTO accounts (id, type, name, details, subscription_date, expiry_date, price, linked_packages, user_id) 
                     VALUES (:id, :type, :name, :details, :subscription_date, :expiry_date, :price, :linked_packages, :user_id)";
            
            $stmt = $db->prepare($query);
            $id = uniqid('acc_', true);
            
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':type', $input['type']);
            $stmt->bindParam(':name', $input['name']);
            $stmt->bindParam(':details', json_encode($input['details']));
            $stmt->bindParam(':subscription_date', $input['subscriptionDate']);
            $stmt->bindParam(':expiry_date', $input['expiryDate']);
            $stmt->bindParam(':price', json_encode($input['price']));
            $stmt->bindParam(':linked_packages', $input['linkedPackages']);
            $stmt->bindParam(':user_id', $userId);
            
            $stmt->execute();
            
            // Log activity
            $logQuery = "INSERT INTO activity_logs (user_id, action_type, object_type, object_id, object_name, details) 
                        VALUES (:user_id, 'create', 'account', :object_id, :object_name, :details)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->bindParam(':user_id', $userId);
            $logStmt->bindParam(':object_id', $id);
            $logStmt->bindParam(':object_name', $input['name']);
            $logStmt->bindParam(':details', "Created new account: " . $input['name']);
            $logStmt->execute();
            
            echo json_encode(['success' => true, 'id' => $id]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $accountId = $_GET['id'] ?? null;
        
        if (!$accountId) {
            http_response_code(400);
            echo json_encode(['error' => 'Account ID is required']);
            exit();
        }
        
        try {
            $query = "UPDATE accounts SET type = :type, name = :name, details = :details, 
                     subscription_date = :subscription_date, expiry_date = :expiry_date, 
                     price = :price, linked_packages = :linked_packages 
                     WHERE id = :id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $accountId);
            $stmt->bindParam(':type', $input['type']);
            $stmt->bindParam(':name', $input['name']);
            $stmt->bindParam(':details', json_encode($input['details']));
            $stmt->bindParam(':subscription_date', $input['subscriptionDate']);
            $stmt->bindParam(':expiry_date', $input['expiryDate']);
            $stmt->bindParam(':price', json_encode($input['price']));
            $stmt->bindParam(':linked_packages', $input['linkedPackages']);
            
            $stmt->execute();
            
            // Log activity
            $logQuery = "INSERT INTO activity_logs (user_id, action_type, object_type, object_id, object_name, details) 
                        VALUES (:user_id, 'update', 'account', :object_id, :object_name, :details)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->bindParam(':user_id', $userId);
            $logStmt->bindParam(':object_id', $accountId);
            $logStmt->bindParam(':object_name', $input['name']);
            $logStmt->bindParam(':details', "Updated account: " . $input['name']);
            $logStmt->execute();
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        $accountId = $_GET['id'] ?? null;
        
        if (!$accountId) {
            http_response_code(400);
            echo json_encode(['error' => 'Account ID is required']);
            exit();
        }
        
        try {
            // Get account name for logging
            $nameQuery = "SELECT name FROM accounts WHERE id = :id";
            $nameStmt = $db->prepare($nameQuery);
            $nameStmt->bindParam(':id', $accountId);
            $nameStmt->execute();
            $account = $nameStmt->fetch(PDO::FETCH_ASSOC);
            
            // Delete account
            $query = "DELETE FROM accounts WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $accountId);
            $stmt->execute();
            
            // Delete associated packages
            $packageQuery = "DELETE FROM packages WHERE account_id = :account_id";
            $packageStmt = $db->prepare($packageQuery);
            $packageStmt->bindParam(':account_id', $accountId);
            $packageStmt->execute();
            
            // Log activity
            if ($account) {
                $logQuery = "INSERT INTO activity_logs (user_id, action_type, object_type, object_id, object_name, details) 
                            VALUES (:user_id, 'delete', 'account', :object_id, :object_name, :details)";
                $logStmt = $db->prepare($logQuery);
                $logStmt->bindParam(':user_id', $userId);
                $logStmt->bindParam(':object_id', $accountId);
                $logStmt->bindParam(':object_name', $account['name']);
                $logStmt->bindParam(':details', "Deleted account: " . $account['name']);
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