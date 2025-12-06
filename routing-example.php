<?php

// یہ admin/index.php میں routing کے لیے add کریں

// WhatsApp Routes
if (route(1) === 'whatsapp') {
    // Check if direct view access
    if (!route(2)) {
        // Load WhatsApp view
        include __DIR__ . '/views/whatsapp.php';
    } else {
        // AJAX handlers
        $_GET['action'] = 'whatsapp-' . route(2);
        include __DIR__ . '/controller/whatsapp-ajax.php';
    }
}

// یہ سب existing routing میں add کریں
// admin/index.php فائل میں یہ lines add کریں routes section میں

?>
