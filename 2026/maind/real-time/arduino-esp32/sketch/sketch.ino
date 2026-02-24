#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// ---------------- WIFI ----------------
const char* ssid     = "FabulousNet";
const char* password = "25jan2022";

// ---------------- ABLY MQTT (OFFICIAL) ----------------
const char* mqtt_host = "main.mqtt.ably.net";
const int   mqtt_port = 8883;

// username = API_KEY_NAME
// password = API_KEY_SECRET



const char* mqtt_user = "biplaQ.iovzWA";
const char* mqtt_pass = "ffx3oR9mKYBjDAfLiHlVJ4KWacO_9mEU6KOocxicrKY";

WiFiClientSecure secureClient;
PubSubClient client(secureClient);

//  fake number for test
int alphaVal = 0;   // 0..359
int betaVal  = -90; // -90..90
int gammaVal = -90; // -90..90

void connectWifi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

void connectAbly() {
  while (!client.connected()) {
    Serial.print("Connecting to Ably MQTT...");
    if (client.connect("esp32-client", mqtt_user, mqtt_pass)) {
      Serial.println(" connected!");
    } else {
      Serial.print(" failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2 seconds...");
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  connectWifi();

  // per test (in produzione: CA cert)
  secureClient.setInsecure();

  client.setServer(mqtt_host, mqtt_port);
  client.setBufferSize(1024);

  connectAbly();
}

void loop() {
  if (!client.connected()) connectAbly();
  client.loop();

  // JSON (string)
  char payload[128];
  snprintf(payload, sizeof(payload),
           "{\"alpha\":%d,\"beta\":%d,\"gamma\":%d}",
           alphaVal, betaVal, gammaVal);

  bool ok = client.publish("motion", payload);

  Serial.print("Sent: ");
  Serial.println(payload);
  Serial.println(ok ? "OK" : "FAILED");

  // fake data
  alphaVal = (alphaVal + 10) % 360;

  betaVal += 5;
  if (betaVal > 90) betaVal = -90;

  gammaVal += 7;
  if (gammaVal > 90) gammaVal = -90;

  delay(200); 
}