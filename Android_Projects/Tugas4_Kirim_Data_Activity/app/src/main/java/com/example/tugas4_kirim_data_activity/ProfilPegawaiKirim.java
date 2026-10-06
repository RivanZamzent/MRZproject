package com.example.tugas4_kirim_data_activity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.EditText;
import androidx.appcompat.app.AppCompatActivity;

public class ProfilPegawaiKirim extends AppCompatActivity {

    EditText edHasilNama, edHasilAlamat, edHasilUmur;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profil_pegawai_kirim);

        edHasilNama = findViewById(R.id.ed_hasil_nama);
        edHasilAlamat = findViewById(R.id.ed_hasil_alamat);
        edHasilUmur = findViewById(R.id.ed_hasil_umur);

        Intent intent = getIntent();
        String hasilNama = intent.getStringExtra("NAMA");
        String hasilAlamat = intent.getStringExtra("ALAMAT");
        float hasilUmur = intent.getFloatExtra("UMUR", 0);

        edHasilNama.setText(hasilNama);
        edHasilAlamat.setText(hasilAlamat);
        edHasilUmur.setText(hasilUmur + ""); // Ditambah "" agar float bisa dibaca sebagai teks
    }
}