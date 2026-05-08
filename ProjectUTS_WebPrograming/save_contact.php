<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// ========================
//  DATABASE CONFIG
// ========================
$host   = 'localhost';
$dbname = 'portofolio_contact';
$user   = 'root';
$pass   = '';  // default XAMPP password kosong

// ========================
//  ONLY ACCEPT POST
// ========================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

// ========================
//  GET & VALIDATE INPUT
// ========================
$input = json_decode(file_get_contents('php://input'), true);

$name    = isset($input['name'])    ? trim($input['name'])    : '';
$email   = isset($input['email'])   ? trim($input['email'])   : '';
$message = isset($input['message']) ? trim($input['message']) : '';

if (empty($name) || empty($email) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Semua field harus diisi.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Format email tidak valid.']);
    exit;
}

// Sanitize
$name    = htmlspecialchars($name,    ENT_QUOTES, 'UTF-8');
$email   = htmlspecialchars($email,   ENT_QUOTES, 'UTF-8');
$message = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');

// ========================
//  CONNECT TO DATABASE
// ========================
try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal: ' . $e->getMessage()]);
    exit;
}

// ========================
//  INSERT DATA
// ========================
try {
    $stmt = $pdo->prepare(
        "INSERT INTO contacts (name, email, message, created_at) VALUES (:name, :email, :message, NOW())"
    );
    $stmt->execute([
        ':name'    => $name,
        ':email'   => $email,
        ':message' => $message,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Pesan berhasil dikirim! Terima kasih, ' . $name . ' 🎉'
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan pesan: ' . $e->getMessage()]);
}
?>
