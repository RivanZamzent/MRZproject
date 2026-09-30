package com.example.tugas3_konversi_nilai_activity;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    EditText edTugas, edKehadiran, edNilaiAngka, edHuruf;
    Button btnHitung;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        edTugas = findViewById(R.id.ed_tugas);
        edKehadiran = findViewById(R.id.ed_kehadiran);
        edNilaiAngka = findViewById(R.id.ed_nilai_angka);
        edHuruf = findViewById(R.id.ed_huruf);
        btnHitung = findViewById(R.id.btn_hitung);

        btnHitung.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                float vTugas = Float.parseFloat(edTugas.getText().toString());
                float vKehadiran = Float.parseFloat(edKehadiran.getText().toString());

                double nilaiAngka = (vTugas * 0.40) + (vKehadiran * 0.60);
                edNilaiAngka.setText(String.valueOf(nilaiAngka));

                String vHuruf;
                if (nilaiAngka >= 80) {
                    vHuruf = "A";
                } else if (nilaiAngka >= 60) {
                    vHuruf = "B";
                } else {
                    vHuruf = "C";
                }

                edHuruf.setText(vHuruf);
            }
        });
    }
}