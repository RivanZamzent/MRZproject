package com.example.project2_kondisionalactivity;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    // Deklarasi Variabel
    private EditText edNilaiAngka, edHasil;
    private Button btProses;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Inisialisasi atau Menghubungkan variabel dengan ID di XML
        edNilaiAngka = findViewById(R.id.ed_nilai_angka);
        edHasil = findViewById(R.id.ed_hasil);
        btProses = findViewById(R.id.bt_proses);

        // Aksi ketika tombol "Proses" diklik
        btProses.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Ambil teks dari EditText
                String inputNilai = edNilaiAngka.getText().toString();

                // Pengecekan jika input masih kosong agar aplikasi tidak crash
                if (inputNilai.isEmpty()) {
                    Toast.makeText(MainActivity.this, "Nilai tidak boleh kosong!", Toast.LENGTH_SHORT).show();
                    return;
                }

                // Ubah string ke tipe double
                double vNilaiAngka = Double.parseDouble(inputNilai);
                String vHasil = "";

                // Kondisional (If-Else)
                if (vNilaiAngka >= 60) {
                    vHasil = "Lulus";
                } else {
                    vHasil = "Gagal";
                }

                // Tampilkan hasil ke EditText hasil
                edHasil.setText(vHasil);
            }
        });
    }
}