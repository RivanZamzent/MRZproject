<?php
$section = isset($_GET['section']) ? $_GET['section'] : 'about';

$card_active = ($section !== 'about') ? 'is-active' : '';

$about_active = ($section === 'about') ? 'is-active' : '';
$experience_active = ($section === 'experience') ? 'is-active' : '';
$contact_active = ($section === 'contact') ? 'is-active' : '';
$showcase_active = ($section === 'showcase') ? 'is-active' : '';

$html = file_get_contents('Portofolio.html');

$html = str_replace('{{CARD_ACTIVE}}', $card_active, $html);
$html = str_replace('{{SECTION_STATE}}', $section, $html);
$html = str_replace('{{ABOUT_ACTIVE}}', $about_active, $html);
$html = str_replace('{{EXP_ACTIVE}}', $experience_active, $html);
$html = str_replace('{{CONTACT_ACTIVE}}', $contact_active, $html);
$html = str_replace('{{SHOWCASE_ACTIVE}}', $showcase_active, $html);

echo $html;
?>
