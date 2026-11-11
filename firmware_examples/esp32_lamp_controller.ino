/*
  Smart Pole Monitoring and Control System
  Pole-Side Controller: Streetlight Relay Control via HTTP Polling
  
  Target hardware: ESP32 / ESP8266 / Proteus Simulation
  Required libraries: WiFi.h, HTTPClient.h, ArduinoJson.h
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Central Management Server API URL
// Replace with the IP address of your machine running the Node.js backend
const char* serverUrl = "http://192.168.1.100:5000/api/v1/lamp";

// GPIO Pin connected to Relay or LED (Simulation / Hardware)
const int LAMP_RELAY_PIN = 23;

// Polling interval in milliseconds
const unsigned long POLL_INTERVAL = 2000;
unsigned long lastPollTime = 0;

void setup() {
  Serial.begin(115200);
  pinMode(LAMP_RELAY_PIN, OUTPUT);
  digitalWrite(LAMP_RELAY_PIN, LOW); // Start with lamp OFF

  // Connect to WiFi
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Check if it's time to poll the server
  if (millis() - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = millis();
    fetchLampCommand();
  }
}

void fetchLampCommand() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Skipping poll.");
    return;
  }

  HTTPClient http;
  http.begin(serverUrl);
  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    String payload = http.getString();
    
    // Parse JSON response
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      const char* status = doc["data"]["status"];
      int brightness = doc["data"]["brightness"];

      Serial.print("Current Lamp Command from Backend: ");
      Serial.println(status);

      if (strcmp(status, "ON") == 0) {
        digitalWrite(LAMP_RELAY_PIN, HIGH);
        Serial.println(">> Streetlight turned [ON]");
      } else {
        digitalWrite(LAMP_RELAY_PIN, LOW);
        Serial.println(">> Streetlight turned [OFF]");
      }
    } else {
      Serial.print("JSON parse error: ");
      Serial.println(error.c_str());
    }
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}
