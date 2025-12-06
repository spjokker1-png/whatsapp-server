<?php

// یہ functions آپ کے existing code میں add کریں

// جب user register ہو - یہ کال کریں
function sendWhatsAppRegisterMessage($userId, $userName, $userPhone, $userEmail) {
    global $conn;
    
    try {
        require_once __DIR__ . '/../admin/controller/whatsapp.php';
        
        $whatsApp = new WhatsAppController($conn);
        
        // Configuration چیک کریں
        $config = $whatsApp->getConfig();
        
        if (!$config['whatsapp_enabled'] || !$config['message_on_register']) {
            return false;
        }
        
        // Template process کریں
        $message = $whatsApp->processTemplate(
            $config['register_message_template'],
            [
                'name' => $userName,
                'username' => $userName,
                'email' => $userEmail,
                'registration_date' => date('Y-m-d H:i:s')
            ]
        );
        
        // WhatsApp سے message بھیجیں
        $result = $whatsApp->sendMessage($userPhone, $message);
        
        if ($result['success'] ?? false) {
            $whatsApp->logMessage($userPhone, 'registration', $message, $userId, null, 'sent');
            return true;
        } else {
            $whatsApp->logMessage($userPhone, 'registration', $message, $userId, null, 'failed');
            return false;
        }
    } catch (Exception $e) {
        return false;
    }
}

// جب order place ہو - یہ کال کریں
function sendWhatsAppOrderMessage($orderId, $userId, $userName, $userPhone, $serviceName, $quantity, $price) {
    global $conn;
    
    try {
        require_once __DIR__ . '/../admin/controller/whatsapp.php';
        
        $whatsApp = new WhatsAppController($conn);
        
        // Configuration چیک کریں
        $config = $whatsApp->getConfig();
        
        if (!$config['whatsapp_enabled'] || !$config['message_on_order']) {
            return false;
        }
        
        // Template process کریں
        $message = $whatsApp->processTemplate(
            $config['order_message_template'],
            [
                'name' => $userName,
                'service' => $serviceName,
                'quantity' => $quantity,
                'price' => $price,
                'order_id' => $orderId
            ]
        );
        
        // WhatsApp سے message بھیجیں
        $result = $whatsApp->sendMessage($userPhone, $message);
        
        if ($result['success'] ?? false) {
            $whatsApp->logMessage($userPhone, 'order', $message, $userId, $orderId, 'sent');
            return true;
        } else {
            $whatsApp->logMessage($userPhone, 'order', $message, $userId, $orderId, 'failed');
            return false;
        }
    } catch (Exception $e) {
        return false;
    }
}

// Bulk message بھیجنے کے لیے
function sendBulkWhatsAppMessages($recipients) {
    global $conn;
    
    try {
        require_once __DIR__ . '/../admin/controller/whatsapp.php';
        
        $whatsApp = new WhatsAppController($conn);
        
        // recipients array میں یہ format ہونا چاہیے:
        // [
        //     ['phone' => '923365823432', 'message' => 'Hello'],
        //     ['phone' => '923365823433', 'message' => 'Hi']
        // ]
        
        $result = $whatsApp->sendBulkMessages($recipients);
        
        return $result;
    } catch (Exception $e) {
        return ['success' => false, 'error' => $e->getMessage()];
    }
}

?>
