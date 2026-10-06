package com.example.tugas4_kirim_data_activity;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    EditText edNama, edAlamat, edUmur;
    Button btnKirim;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        edNama = findViewById(R.id.ed_nama);
        edAlamat = findViewById(R.id.ed_alamat);
        edUmur = findViewById(R.id.ed_umur);
        btnKirim = findViewById(R.id.btn_kirim);

        btnKirim.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                // Ambil data dari EditText
                String vNama = edNama.getText().toString();
                String vAlamat = edAlamat.getText().toString();

                float vUmur = 0;
                if (!edUmur.getText().toString().isEmpty()) {
                    vUmur = Float.parseFloat(edUmur.getText().toString());
                }

                Intent intent = new Intent(MainActivity.this, ProfilPegawaiKirim.class);
                intent.putExtra("NAMA", vNama);
                intent.putExtra("ALAMAT", vAlamat);
                intent.putExtra("UMUR", vUmur);
                startActivity(intent);
            }
        });
    }
}