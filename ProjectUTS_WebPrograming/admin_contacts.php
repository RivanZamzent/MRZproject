<?php
// ========================
//  CONFIG
// ========================
$ADMIN_PASSWORD = 'admin123'; // Ganti password sesuai keinginan!
$host   = 'localhost';
$dbname = 'portofolio_contact';
$db_user = 'root';
$db_pass = '';

session_start();

// ========================
//  HANDLE LOGIN / LOGOUT
// ========================
if (isset($_POST['login'])) {
    if ($_POST['password'] === $ADMIN_PASSWORD) {
        $_SESSION['admin_logged_in'] = true;
    } else {
        $login_error = 'Password salah! Coba lagi.';
    }
}
if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin_contacts.php');
    exit;
}

$logged_in = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'];

// ========================
//  DATABASE CONNECTION
// ========================
$pdo = null;
$db_error = null;
if ($logged_in) {
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $e) {
        $db_error = $e->getMessage();
    }
}

// ========================
//  ACTIONS (mark read / delete)
// ========================
if ($logged_in && $pdo) {
    // Mark as read
    if (isset($_GET['mark_read'])) {
        $pdo->prepare("UPDATE contacts SET is_read = 1 WHERE id = ?")->execute([(int)$_GET['mark_read']]);
        header('Location: admin_contacts.php');
        exit;
    }
    // Mark as unread
    if (isset($_GET['mark_unread'])) {
        $pdo->prepare("UPDATE contacts SET is_read = 0 WHERE id = ?")->execute([(int)$_GET['mark_unread']]);
        header('Location: admin_contacts.php');
        exit;
    }
    // Delete single
    if (isset($_GET['delete'])) {
        $pdo->prepare("DELETE FROM contacts WHERE id = ?")->execute([(int)$_GET['delete']]);
        header('Location: admin_contacts.php');
        exit;
    }
    // Delete all read
    if (isset($_GET['delete_read'])) {
        $pdo->exec("DELETE FROM contacts WHERE is_read = 1");
        header('Location: admin_contacts.php');
        exit;
    }
}

// ========================
//  FETCH DATA
// ========================
$contacts    = [];
$total       = 0;
$unread      = 0;
if ($logged_in && $pdo) {
    $contacts = $pdo->query("SELECT * FROM contacts ORDER BY created_at DESC")->fetchAll();
    $total    = count($contacts);
    $unread   = $pdo->query("SELECT COUNT(*) FROM contacts WHERE is_read = 0")->fetchColumn();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin — Pesan Masuk | Portofolio MRZ</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:        #0a0a0f;
      --surface:   #12121a;
      --glass:     rgba(255,255,255,0.04);
      --border:    rgba(255,255,255,0.08);
      --accent:    #8a84ff;
      --accent2:   #53c8ef;
      --success:   #00cec9;
      --danger:    #ff6b6b;
      --warn:      #fdcb6e;
      --text:      #e8e8f0;
      --muted:     rgba(232,232,240,0.45);
      --radius:    16px;
      --shadow:    0 8px 32px rgba(0,0,0,0.5);
    }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      background-image:
        radial-gradient(ellipse 60% 50% at 20% 10%, rgba(138,132,255,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 80%, rgba(83,200,239,0.08) 0%, transparent 60%);
    }

    /* ===== LOGIN PAGE ===== */
    .login-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .login-card {
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 3rem 2.5rem;
      width: 100%;
      max-width: 420px;
      backdrop-filter: blur(20px);
      box-shadow: var(--shadow);
      text-align: center;
      animation: fadeUp .5s ease both;
    }
    .login-card .lock-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
      display: block;
    }
    .login-card h1 {
      font-size: 1.6rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: .4rem;
    }
    .login-card p {
      color: var(--muted);
      font-size: .9rem;
      margin-bottom: 2rem;
    }
    .login-card input[type="password"] {
      width: 100%;
      padding: .85rem 1.2rem;
      background: rgba(255,255,255,0.06);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text);
      font-size: 1rem;
      font-family: inherit;
      outline: none;
      transition: border-color .2s, box-shadow .2s;
      margin-bottom: 1rem;
      letter-spacing: .1em;
    }
    .login-card input[type="password"]:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(138,132,255,.15);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      padding: .8rem 1.6rem;
      border-radius: 12px;
      font-family: inherit;
      font-size: .9rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all .2s;
      text-decoration: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent), #6c63ff);
      color: #fff;
      width: 100%;
      justify-content: center;
      font-size: 1rem;
      padding: .9rem;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(138,132,255,.4); }
    .btn-success { background: rgba(0,206,201,.15); color: var(--success); border: 1px solid rgba(0,206,201,.3); }
    .btn-success:hover { background: rgba(0,206,201,.25); }
    .btn-danger  { background: rgba(255,107,107,.15); color: var(--danger); border: 1px solid rgba(255,107,107,.3); }
    .btn-danger:hover  { background: rgba(255,107,107,.25); }
    .btn-ghost   { background: var(--glass); color: var(--muted); border: 1px solid var(--border); }
    .btn-ghost:hover   { color: var(--text); background: rgba(255,255,255,.08); }
    .btn-sm { padding: .4rem .85rem; font-size: .78rem; border-radius: 8px; }

    .error-msg {
      background: rgba(255,107,107,.12);
      border: 1px solid rgba(255,107,107,.3);
      color: var(--danger);
      padding: .75rem 1rem;
      border-radius: 10px;
      font-size: .9rem;
      margin-bottom: 1rem;
    }

    /* ===== ADMIN LAYOUT ===== */
    .admin-wrapper { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }

    /* Header */
    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .admin-header-left h1 {
      font-size: 1.6rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .admin-header-left p { color: var(--muted); font-size: .85rem; margin-top: .2rem; }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.2rem 1.4rem;
      backdrop-filter: blur(12px);
      transition: transform .2s;
    }
    .stat-card:hover { transform: translateY(-3px); }
    .stat-card .stat-label { font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin-bottom: .5rem; }
    .stat-card .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-card.total .stat-value  { color: var(--accent); }
    .stat-card.unread .stat-value { color: var(--warn); }
    .stat-card.read   .stat-value { color: var(--success); }

    /* Toolbar */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.2rem;
    }
    .toolbar-title { font-size: 1rem; font-weight: 600; color: var(--muted); }

    /* Table */
    .table-wrapper {
      background: var(--glass);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      backdrop-filter: blur(12px);
      box-shadow: var(--shadow);
    }
    table { width: 100%; border-collapse: collapse; }
    thead { background: rgba(138,132,255,.1); }
    thead th {
      padding: 1rem 1.2rem;
      text-align: left;
      font-size: .75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
    }
    tbody tr {
      border-bottom: 1px solid var(--border);
      transition: background .15s;
    }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: rgba(255,255,255,.03); }
    tbody tr.unread-row { border-left: 3px solid var(--warn); }
    tbody td {
      padding: 1rem 1.2rem;
      font-size: .875rem;
      vertical-align: top;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      padding: .25rem .65rem;
      border-radius: 99px;
      font-size: .72rem;
      font-weight: 700;
    }
    .badge-unread { background: rgba(253,203,110,.15); color: var(--warn); border: 1px solid rgba(253,203,110,.3); }
    .badge-read   { background: rgba(0,206,201,.12);  color: var(--success); border: 1px solid rgba(0,206,201,.25); }

    .name-cell { font-weight: 600; color: var(--text); }
    .email-cell { color: var(--accent2); font-size: .82rem; }
    .msg-cell { color: var(--muted); line-height: 1.5; max-width: 340px; }
    .date-cell { color: var(--muted); font-size: .8rem; white-space: nowrap; }
    .actions-cell { display: flex; gap: .5rem; flex-wrap: wrap; }

    /* Empty */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--muted);
    }
    .empty-state .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: .5; }
    .empty-state p { font-size: .95rem; }

    /* Animations */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .admin-wrapper { animation: fadeUp .4s ease both; }

    @media (max-width: 700px) {
      thead th:nth-child(4), tbody td:nth-child(4) { display: none; }
      .msg-cell { max-width: 180px; }
    }
  </style>
</head>
<body>

<?php if (!$logged_in): ?>
<!-- ===== LOGIN VIEW ===== -->
<div class="login-wrapper">
  <div class="login-card">
    <span class="lock-icon">🔐</span>
    <h1>Admin Panel</h1>
    <p>Masukkan password untuk melihat pesan masuk dari pengunjung portofolio.</p>

    <?php if (isset($login_error)): ?>
      <div class="error-msg">⚠️ <?= htmlspecialchars($login_error) ?></div>
    <?php endif; ?>

    <form method="POST" action="">
      <input type="password" name="password" placeholder="••••••••••" autofocus autocomplete="current-password">
      <button type="submit" name="login" class="btn btn-primary">🚀 MASUK</button>
    </form>
  </div>
</div>

<?php else: ?>
<!-- ===== ADMIN VIEW ===== -->
<div class="admin-wrapper">

  <!-- Header -->
  <div class="admin-header">
    <div class="admin-header-left">
      <h1>📬 Pesan Masuk</h1>
      <p>Portofolio — Mas'ud Rifan Zamzen · <?= date('d M Y') ?></p>
    </div>
    <a href="?logout" class="btn btn-ghost btn-sm">🚪 Logout</a>
  </div>

  <?php if ($db_error): ?>
    <div class="error-msg">❌ Koneksi database gagal: <?= htmlspecialchars($db_error) ?></div>
  <?php else: ?>

  <!-- Stats -->
  <div class="stats-row">
    <div class="stat-card total">
      <div class="stat-label">📨 Total Pesan</div>
      <div class="stat-value"><?= $total ?></div>
    </div>
    <div class="stat-card unread">
      <div class="stat-label">🔔 Belum Dibaca</div>
      <div class="stat-value"><?= $unread ?></div>
    </div>
    <div class="stat-card read">
      <div class="stat-label">✅ Sudah Dibaca</div>
      <div class="stat-value"><?= $total - $unread ?></div>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="toolbar">
    <span class="toolbar-title">Semua Pesan</span>
    <?php if (($total - $unread) > 0): ?>
      <a href="?delete_read=1"
         class="btn btn-danger btn-sm"
         onclick="return confirm('Hapus semua pesan yang sudah dibaca?')">
        🗑️ Hapus Semua Yg Sudah Dibaca
      </a>
    <?php endif; ?>
  </div>

  <!-- Table -->
  <div class="table-wrapper">
    <?php if (empty($contacts)): ?>
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p>Belum ada pesan masuk.</p>
      </div>
    <?php else: ?>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Pengirim</th>
          <th>Pesan</th>
          <th>Waktu</th>
          <th>Status</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($contacts as $c): ?>
        <tr class="<?= $c['is_read'] ? '' : 'unread-row' ?>">
          <td style="color:var(--muted);font-size:.8rem;"><?= $c['id'] ?></td>
          <td>
            <div class="name-cell"><?= htmlspecialchars(html_entity_decode($c['name'], ENT_QUOTES, 'UTF-8')) ?></div>
            <div class="email-cell"><?= htmlspecialchars(html_entity_decode($c['email'], ENT_QUOTES, 'UTF-8')) ?></div>
          </td>
          <td class="msg-cell"><?= nl2br(htmlspecialchars(html_entity_decode($c['message'], ENT_QUOTES, 'UTF-8'))) ?></td>
          <td class="date-cell">
            <?= date('d M Y', strtotime($c['created_at'])) ?><br>
            <span style="font-size:.75rem;"><?= date('H:i', strtotime($c['created_at'])) ?> WIB</span>
          </td>
          <td>
            <?php if ($c['is_read']): ?>
              <span class="badge badge-read">✅ Dibaca</span>
            <?php else: ?>
              <span class="badge badge-unread">🔔 Baru</span>
            <?php endif; ?>
          </td>
          <td class="actions-cell">
            <?php if (!$c['is_read']): ?>
              <a href="?mark_read=<?= $c['id'] ?>" class="btn btn-success btn-sm">✅ Tandai Dibaca</a>
            <?php else: ?>
              <a href="?mark_unread=<?= $c['id'] ?>" class="btn btn-ghost btn-sm">↩️ Tandai Belum</a>
            <?php endif; ?>
            <a href="?delete=<?= $c['id'] ?>"
               class="btn btn-danger btn-sm"
               onclick="return confirm('Hapus pesan dari <?= htmlspecialchars(addslashes($c['name'])) ?>?')">
              🗑️
            </a>
          </td>
        </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </div>

  <?php endif; ?>
</div>
<?php endif; ?>

</body>
</html>
