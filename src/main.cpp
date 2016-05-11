#include <Arduino.h>

#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <WebSocketsServer.h>
#include <ESP8266WebServer.h>
#include <Hash.h>
#include <FS.h>

DNSServer dns;
ESP8266WebServer http = ESP8266WebServer(80);
WebSocketsServer websocket = WebSocketsServer(81);

String nicks[WEBSOCKETS_SERVER_CLIENT_MAX];
struct {
	uint32_t timer;
	int8_t counter;
} blink = {0, 0};

void clearLog() {
	File f = SPIFFS.open("/log.txt", "w");
	if(!f) return;
	f.print("     ____ _           _\n");
	f.print("    / ___| |__   __ _| |_\n");
	f.print("   | |   | '_ \\ / _` | __|\n");
	f.print("   | |___| | | | (_| | |_\n");
	f.print("    \\____|_| |_|\\__,_|\\__|\n");
	f.print(" \n");
	f.print("==============================\n");
	f.print(" \n");
	f.print("[Teclea \"/nick NOMBRE\" para cambiar tu nombre]\n");
	f.print(" \n");
	f.close();
}

void truncateLog() {
	if(!SPIFFS.rename("/log.txt", "/log.old")) return;
	clearLog();
	File old = SPIFFS.open("/log.old", "r");
	if(!old) return;
	File truncated = SPIFFS.open("/log.txt", "a+");
	if(!truncated) {
		old.close();
		SPIFFS.remove("/log.old");
		return;
	}
	old.seek(old.size() - 10000, SeekSet);
	(void) old.readStringUntil('\n');
	String entry = old.readStringUntil('\n');
	while(entry.length()) {
		truncated.print(entry + "\n");
		entry = old.readStringUntil('\n');
	}
	old.close();
	truncated.close();
	SPIFFS.remove("/log.old");
}

void logToFile(String &nick, const char *message, bool server = false) {
	File f = SPIFFS.open("/log.txt", "a+");
	if(!f) return;
	if(f.size() >= 20000) {
		f.close();
		truncateLog();
		f = SPIFFS.open("/log.txt", "a+");
		if(!f) return;
	}
	String entry = server ? "[" : "<";
	entry += nick;
	entry += server ? "]" : ">";
	entry += " ";
	entry += message;
	f.print(entry + "\n");
	f.close();
}

void websocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght) {
	String message = "";
	switch(type) {
		case WStype_DISCONNECTED:
			logToFile(nicks[num], "Se ha desconectado.", true);
			nicks[num] = "";
			message += num;
			websocket.broadcastTXT((uint8_t *) message.c_str(), message.length(), false, num);
		break;
		case WStype_CONNECTED:
			digitalWrite(LED_BUILTIN, LOW);
			blink.timer = millis() + 500;
			blink.counter = 8;
			for(uint8_t i=0; i<WEBSOCKETS_SERVER_CLIENT_MAX; i++) {
				if(nicks[i].length()) {
					String message = "-";
					message += i;
					message += ":";
					message += nicks[i];
					websocket.sendTXT(num, message);
				}
			}
			payload++;
			nicks[num] = (char *) payload;
		case WStype_TEXT:
			logToFile(nicks[num], type == WStype_CONNECTED ? "Se ha conectado." : (char *) payload, type == WStype_CONNECTED);
			message += num;
			message += ":";
			message += (char *) payload;
			websocket.broadcastTXT((uint8_t *) message.c_str(), message.length(), false, num);
		break;
	}
}

void setup() {
	SPIFFS.begin();

	File f = SPIFFS.open("/log.txt", "r");
	if(!f) clearLog();
	else f.close();

	dns.start(53, "*", WiFi.softAPIP());
	
	http.serveStatic("/", SPIFFS, "/index.html", "max-age=86400");
	http.serveStatic("/screen.css", SPIFFS, "/screen.css", "max-age=86400");
	http.serveStatic("/app.js", SPIFFS, "/app.js", "max-age=86400");
	http.serveStatic("/log.txt", SPIFFS, "/log.txt", "no-cache");
	http.on("/api/clear", []() {
		clearLog();
		http.send(200, "text/plain", "OK");
	});
	http.on("/api/config", []() {
		if(!http.hasArg("ssid") || !http.hasArg("pass")) {
			http.send(404, "text/plain");
			return;
		}
		String ssid = http.arg("ssid");
		String pass = http.arg("pass");

		WiFi.disconnect();
		if(ssid == "AP") {
			WiFi.mode(WIFI_AP);
		} else {
			WiFi.mode(WIFI_AP_STA);
		}
		WiFi.softAP("Chat");
		if(ssid != "AP") {
			WiFi.begin(ssid.c_str(), pass.c_str());
		}
		ESP.reset();
	});
	http.onNotFound([]() {
		File f = SPIFFS.open("/index.html", "r");
		if(!f) {
			http.send(404, "text/plain");
		} else {
			http.sendHeader("Cache-Control", "no-cache");
			http.streamFile(f, "text/html");
		}
	});
	http.begin();

	pinMode(LED_BUILTIN, OUTPUT);
	digitalWrite(LED_BUILTIN, HIGH);

	websocket.begin();
	websocket.onEvent(websocketEvent);
}

void loop() {
	dns.processNextRequest();
	http.handleClient();
	websocket.loop();
	if(blink.timer != 0 && blink.timer <= millis()) {
		digitalWrite(LED_BUILTIN, blink.counter % 2 == 0 ? HIGH : LOW);
		if(blink.counter > 0) {
			blink.counter--;
			blink.timer = millis() + 500;
		} else {
			blink.timer = 0;
		}
	}
}
