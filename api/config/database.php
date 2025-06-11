<?php
class Database {
    private $host = 'localhost';
    private $db_name = 'bookvfke_subscription_db';
    private $username = 'bookvfke_sub_user';
    private $password = 'h)dc8SF^gyF4';
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            // Log error instead of echoing to prevent breaking JSON responses
            error_log("Database connection error: " . $exception->getMessage());
            return null;
        }
        
        return $this->conn;
    }
}
?>