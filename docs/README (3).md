# Artificer – MING Stack Learning Platform

Bachelor project built for Knightec Group at the University of South-Eastern Norway (USN). The goal was to build an interactive web platform that teaches IIoT concepts through hands-on tasks — using a simulated MING stack backed by real ESP32 sensor data.

**My roles:** Project coordinator and frontend developer

---

## What the platform does

Students work through a series of tasks that simulate each layer of the MING stack — MQTT, InfluxDB, Node-RED, and Grafana. Instead of throwing raw code at the user, the idea was to make the learning interactive and task-driven. The platform uses real load cell sensor data from an ESP32 via InfluxDB, with JavaScript fallback data when the live pipeline is unavailable.

The learning path is locked — students must complete tasks in order, which was a deliberate design choice to build understanding step by step.

---

## My contributions

**Project coordinator**
- Set up and maintained the JIRA board and task plan
- Wrote the system and stakeholder requirements
- Defined milestones and tracked progress across the team
- Had primary responsibility for stakeholder meetings with Knightec and meeting notes
- Designed the system flow diagrams (activity diagrams) — first iteration and all refinements

**Frontend developer**
- MQTT Click and Place task — started in Blazor/C#, rebuilt in vanilla JavaScript after storage constraints on the ESP32-S3 made Blazor unviable
- InfluxDB sorting task — uses real timestamped sensor data from the live InfluxDB instance
- Grafana "Catch the Object" game — iterated several times based on user testing with machine engineers
- Card flip memory game for MQTT terminology
- Multiple choice and true/false quiz system
- localStorage-based point and progression system across all tasks
- Role-based navigation lock (student vs. teacher view)
- Info popup system
- Full Norwegian/English localization (i18n)

---

Bachelor in Cyber Physical Systems, USN Campus Kongsberg, 2026
