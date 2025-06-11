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
            $query = "SELECT c.*, 
                     GROUP_CONCAT(
                         CONCAT(s.id, ':', s.package_id, ':', s.start_date, ':', s.end_date, ':', s.duration, ':', s.status)
                         SEPARATOR '|'
                     ) as subscriptions
                     FROM customers c 
                     LEFT JOIN subscriptions s ON c.id = s.customer_id 
                     GROUP BY c.id 
                     ORDER BY c.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Process subscription history
            foreach ($customers as &$customer) {
                $subscriptionHistory = [];
                if ($customer['subscriptions']) {
                    $subs = explode('|', $customer['subscriptions']);
                    foreach ($subs as $sub) {
                        $parts = explode(':', $sub);
                        if (count($parts) === 6) {
                            $subscriptionHistory[] = [
                                'id' => $parts[0],
                                'packageId' => $parts[1],
                                'startDate' => $parts[2],
                                'endDate' => $parts[3],
                                'duration' => (int)$parts[4],
                                'status' => $parts[5]
                            ];
                        }
                    }
                }
                $customer['subscriptionHistory'] = $subscriptionHistory;
                unset($customer['subscriptions']);
                
                // Set legacy fields for compatibility
                if (!empty($subscriptionHistory)) {
                    $latest = $subscriptionHistory[0];
                    $customer['packageId'] = $latest['packageId'];
                    $customer['subscriptionDuration'] = $latest['duration'];
                    $customer['subscriptionDate'] = $latest['startDate'];
                    $customer['expiryDate'] = $latest['endDate'];
                } else {
                    $customer['packageId'] = '';
                    $customer['subscriptionDuration'] = 0;
                    $customer['subscriptionDate'] = '';
                    $customer['expiryDate'] = '';
                }
            }
            
            echo json_encode(['success' => true, 'data' => $customers]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        try {
            $db->beginTransaction();
            
            // Insert customer
            $query = "INSERT INTO customers (id, name, phone, email, user_id) 
                     VALUES (:id, :name, :phone, :email, :user_id)";
            
            $stmt = $db->prepare($query);
            $customerId = uniqid('cust_', true);
            
            $stmt->bindParam(':id', $customerId);
            $stmt->bindParam(':name', $input['name']);
            $stmt->bindParam(':phone', $input['phone']);
            $stmt->bindParam(':email', $input['email']);
            $stmt->bindParam(':user_id', $userId);
            
            $stmt->execute();
            
            // Insert subscription if package info provided
            if (!empty($input['packageId']) && !empty($input['subscriptionDate'])) {
                $subQuery = "INSERT INTO subscriptions (id, customer_id, package_id, start_date, end_date, duration, status, user_id) 
                            VALUES (:id, :customer_id, :package_id, :start_date, :end_date, :duration, :status, :user_id)";
                
                $subStmt = $db->prepare($subQuery);
                $subscriptionId = uniqid('sub_', true);
                
                $subStmt->bindParam(':id', $subscriptionId);
                $subStmt->bindParam(':customer_id', $customerId);
                $subStmt->bindParam(':package_id', $input['packageId']);
                $subStmt->bindParam(':start_date', $input['subscriptionDate']);
                $subStmt->bindParam(':end_date', $input['expiryDate']);
                $subStmt->bindParam(':duration', $input['subscriptionDuration']);
                $subStmt->bindParam(':status', 'active');
                $subStmt->bindParam(':user_id', $userId);
                
                $subStmt->execute();
                
                // Update package subscriber count
                $updateQuery = "UPDATE packages SET subscribed_customers = subscribed_customers + 1 WHERE id = :package_id";
                $updateStmt = $db->prepare($updateQuery);
                $updateStmt->bindParam(':package_id', $input['packageId']);
                $updateStmt->execute();
            }
            
            $db->commit();
            
            // Log activity
            $logQuery = "INSERT INTO activity_logs (user_id, action_type, object_type, object_id, object_name, details) 
                        VALUES (:user_id, 'create', 'customer', :object_id, :object_name, :details)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->bindParam(':user_id', $userId);
            $logStmt->bindParam(':object_id', $customerId);
            $logStmt->bindParam(':object_name', $input['name']);
            $logStmt->bindParam(':details', "Created new customer: " . $input['name']);
            $logStmt->execute();
            
            echo json_encode(['success' => true, 'id' => $customerId]);
        } catch (Exception $e) {
            $db->rollback();
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        $customerId = $_GET['id'] ?? null;
        
        if (!$customerId) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer ID is required']);
            exit();
        }
        
        try {
            $query = "UPDATE customers SET name = :name, phone = :phone, email = :email WHERE id = :id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $customerId);
            $stmt->bindParam(':name', $input['name']);
            $stmt->bindParam(':phone', $input['phone']);
            $stmt->bindParam(':email', $input['email']);
            
            $stmt->execute();
            
            // Handle subscription history updates if provided
            if (isset($input['subscriptionHistory'])) {
                // This is a complex operation - for now, we'll handle it in the frontend
                // In a real app, you'd want to sync the subscription changes
            }
            
            // Log activity
            $logQuery = "INSERT INTO activity_logs (user_id, action_type, object_type, object_id, object_name, details) 
                        VALUES (:user_id, 'update', 'customer', :object_id, :object_name, :details)";
            $logStmt = $db->prepare($logQuery);
            $logStmt->bindParam(':user_id', $userId);
            $logStmt->bindParam(':object_id', $customerId);
            $logStmt->bindParam(':object_name', $input['name']);
            $logStmt->bindParam(':details', "Updated customer: " . $input['name']);
            $logStmt->execute();
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        $customerId = $_GET['id'] ?? null;
        
        if (!$customerId) {
            http_response_code(400);
            echo json_encode(['error' => 'Customer ID is required']);
            exit();
        }
        
        try {
            // Get customer name for logging
            $nameQuery = "SELECT name FROM customers WHERE id = :id";
            $nameStmt = $db->prepare($nameQuery);
            $nameStmt->bindParam(':id', $customerId);
            $nameStmt->execute();
            $customer = $nameStmt->fetch(PDO::FETCH_ASSOC);
            
            // Delete customer and associated subscriptions
            $query = "DELETE FROM customers WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $customerId);
            $stmt->execute();
            
            $subQuery = "DELETE FROM subscriptions WHERE customer_id = :customer_id";
            $subStmt = $db->prepare($subQuery);
            $subStmt->bindParam(':customer_id', $customerId);
            $subStmt->execute();
            
            // Log activity
            if ($customer) {
                $logQuery = "INSERT INTO activity_logs (user_id, action_type, object_type, object_id, object_name, details) 
                            VALUES (:user_id, 'delete', 'customer', :object_id, :object_name, :details)";
                $logStmt = $db->prepare($logQuery);
                $logStmt->bindParam(':user_id', $userId);
                $logStmt->bindParam(':object_id', $customerId);
                $logStmt->bindParam(':object_name', $customer['name']);
                $logStmt->bindParam(':details', "Deleted customer: " . $customer['name']);
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