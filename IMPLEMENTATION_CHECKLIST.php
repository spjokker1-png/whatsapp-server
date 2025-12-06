<?php
/**
 * WhatsApp Integration - Implementation Guide
 * 
 * یہ file بتاتی ہے کہ آپ کے موجودہ code میں
 * WhatsApp integration کہاں ڈالیں
 */

// ============================================
// STEP 1: header.php میں Menu Add کریں
// ============================================

// جہاں آپ دوسرے menu items ہیں وہاں یہ add کریں
// (تقریباً Additionals dropdown کے بعد)

?>

<!-- یہ code admin/views/header.php میں ڈالیں -->
<?php if ($admin["access"]["admin_access"]): ?>
  <li class="<?php if (route(1) == "whatsapp") : echo 'active' ; endif; ?>">
    <a class="ajax-link" href="<?php echo site_url("admin/whatsapp") ?>">
      <i class="bi bi-chat-dots" style="color: #25D366;"></i>
      <span> WhatsApp</span>
    </a>
  </li>
<?php endif; ?>

<!-- ============================================ -->
<!-- STEP 2: admin/index.php میں Routing Add کریں -->
<!-- ============================================ -->

<?php

// admin/index.php میں، جہاں دوسری routing ہے وہاں یہ add کریں

if (route(1) === 'whatsapp') {
    if (!route(2)) {
        // WhatsApp panel view
        include __DIR__ . '/views/whatsapp.php';
    } else {
        // AJAX endpoints
        $_GET['action'] = 'whatsapp-' . route(2);
        include __DIR__ . '/controller/whatsapp-ajax.php';
    }
}

?>

<!-- ============================================ -->
<!-- STEP 3: User Registration میں Messaging Add کریں -->
<!-- ============================================ -->

<?php

// جہاں آپ user register کرتے ہوں (شاید admin/controller/clients.php یا similar)
// یہ کسے register ہونے کے بعد add کریں:

// چاہے یہ registration form submit handling میں ہو:

// ... existing registration code ...

// User کو database میں add کریں
// INSERT INTO clients ... 

// اب WhatsApp message بھیجیں:
require_once __DIR__ . '/../../whatsapp-server/whatsapp-hooks.php';

$phoneNumber = $_POST['phone'] ?? null; // Form سے phone لیں

if ($phoneNumber) {
    sendWhatsAppRegisterMessage(
        $newUserId,              // نیا user ID
        $newUserName,            // User کا نام
        $phoneNumber,            // WhatsApp number
        $_POST['email']          // Email
    );
}

?>

<!-- ============================================ -->
<!-- STEP 4: Order Placement میں Messaging Add کریں -->
<!-- ============================================ -->

<?php

// جہاں آپ order place کرتے ہوں (شاید admin/controller/orders.php یا similar)
// یہ order create ہونے کے بعد add کریں:

// ... existing order creation code ...

// Order کو database میں add کریں
// INSERT INTO orders ...

// اب WhatsApp message بھیجیں:
require_once __DIR__ . '/../../whatsapp-server/whatsapp-hooks.php';

// Clients table سے user کی details لیں
$stmt = $conn->prepare("SELECT * FROM clients WHERE id = :id");
$stmt->execute([':id' => $userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Services table سے service details لیں
$stmt = $conn->prepare("SELECT * FROM services WHERE id = :id");
$stmt->execute([':id' => $serviceId]);
$service = $stmt->fetch(PDO::FETCH_ASSOC);

if ($user && $service) {
    sendWhatsAppOrderMessage(
        $orderId,              // Order ID
        $userId,               // User ID
        $user['client_name'],  // User کا نام
        $user['client_phone'], // WhatsApp number
        $service['service_name'], // Service کا نام
        $quantity,             // مقدار
        $price                 // قیمت
    );
}

?>

<!-- ============================================ -->
<!-- STEP 5: Database Setup -->
<!-- ============================================ -->

<?php

// phpMyAdmin میں یہ queries چلائیں:

$sql = "
-- WhatsApp Configuration Table
CREATE TABLE IF NOT EXISTS `whatsapp_config` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `whatsapp_enabled` BOOLEAN DEFAULT 1,
    `node_server_url` VARCHAR(255) NOT NULL DEFAULT 'http://localhost:3001',
    `message_on_register` BOOLEAN DEFAULT 1,
    `message_on_order` BOOLEAN DEFAULT 1,
    `register_message_template` LONGTEXT,
    `order_message_template` LONGTEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Message Logs
CREATE TABLE IF NOT EXISTS `whatsapp_message_logs` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `phone` VARCHAR(20),
    `message_type` VARCHAR(50),
    `message_content` LONGTEXT,
    `user_id` INT,
    `order_id` INT,
    `status` VARCHAR(20) DEFAULT 'sent',
    `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial config insert
INSERT INTO whatsapp_config (register_message_template, order_message_template) 
VALUES (
    'سلام {{name}}! 👋\n\nآپ نے ہماری سروس میں شامل ہو گئے ہیں۔\nاپنا اکاؤنٹ اب استعمال کریں۔\n\nشکریہ!',
    'سلام {{name}}! 🎉\n\nآپ کا آرڈر #{{order_id}} مکمل ہو گیا۔\nسروس: {{service}}\nقیمت: {{price}}\n\nمزید مدد کے لیے رابطہ کریں۔'
);
";

?>

<!-- ============================================ -->
<!-- USAGE EXAMPLES -->
<!-- ============================================ -->

<?php

// =======================
// مثال 1: صرف ایک message
// =======================

require_once __DIR__ . '/whatsapp-server/whatsapp-hooks.php';

sendWhatsAppRegisterMessage(
    1,                    // User ID
    'احمد',               // نام
    '923365823432',       // WhatsApp number
    'ahmad@email.com'     // Email
);

// =======================
// مثال 2: بہت سارے users کو message
// =======================

require_once __DIR__ . '/whatsapp-server/whatsapp-hooks.php';

// یہ broadcast کریں تمام users کو

$stmt = $conn->prepare("SELECT * FROM clients WHERE active = 1");
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

$messages = [];
foreach ($users as $user) {
    $messages[] = [
        'phone' => $user['client_phone'],
        'message' => "ہیلو {{name}}!\n\nآپ کے لیے نیا آفر: 50% ڈسکاؤنٹ!\n\nابھی آرڈر دیں۔"
    ];
}

sendBulkWhatsAppMessages($messages);

?>

<!-- ============================================ -->
<!-- FILES CHECKLIST -->
<!-- ============================================ -->

✅ Checklist:

□ Node.js server شروع کیا (npm start)
□ Database tables بنائے (phpMyAdmin میں)
□ admin/views/header.php میں menu add کیا
□ admin/index.php میں routing add کیا
□ User registration میں hook add کیا
□ Order placement میں hook add کیا
□ Test message بھیجی admin panel سے
□ User register کرتے وقت message ملا
□ Order place کرتے وقت message ملا

جب یہ سب complete ہو جائے تو system مکمل ہے! 🎉

