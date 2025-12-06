<?php

// یہ SQL queries ہیں database میں WhatsApp tables بنانے کے لیے
// phpMyAdmin میں یہ run کریں

$sql_queries = [
    // WhatsApp Configuration Table
    "CREATE TABLE IF NOT EXISTS `whatsapp_config` (
        `id` INT PRIMARY KEY AUTO_INCREMENT,
        `whatsapp_enabled` BOOLEAN DEFAULT 1,
        `node_server_url` VARCHAR(255) NOT NULL DEFAULT 'http://localhost:3001',
        `api_key` VARCHAR(255),
        `message_on_register` BOOLEAN DEFAULT 1,
        `message_on_order` BOOLEAN DEFAULT 1,
        `register_message_template` LONGTEXT,
        `order_message_template` LONGTEXT,
        `connection_status` VARCHAR(50) DEFAULT 'disconnected',
        `last_checked` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    // WhatsApp Message Logs
    "CREATE TABLE IF NOT EXISTS `whatsapp_message_logs` (
        `id` INT PRIMARY KEY AUTO_INCREMENT,
        `phone` VARCHAR(20),
        `message_type` VARCHAR(50),
        `message_content` LONGTEXT,
        `user_id` INT,
        `order_id` INT,
        `status` VARCHAR(20) DEFAULT 'sent',
        `error_message` TEXT,
        `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )",

    // WhatsApp Connection Log
    "CREATE TABLE IF NOT EXISTS `whatsapp_connection_log` (
        `id` INT PRIMARY KEY AUTO_INCREMENT,
        `event_type` VARCHAR(50),
        `status` VARCHAR(50),
        `details` LONGTEXT,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )"
];

?>
