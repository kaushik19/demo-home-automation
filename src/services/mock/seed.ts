// Seed data for the mock backend.  Realistic, demoable, and tuned
// to make the charts and KPIs look meaningful out of the box.

import type {
  Automation,
  Device,
  Household,
  Room,
  Scene,
} from "@/types";

export const household: Household = {
  id: "hh_001",
  name: "Sharma Residence",
  ownerName: "Aryan Sharma",
  address: "Flat 1402, Skyline Heights, Bengaluru",
  timezone: "Asia/Kolkata",
  currency: "INR",
};

export const rooms: Room[] = [
  { id: "r_living",   name: "Living Room", icon: "Sofa",      temperature: 24.5, humidity: 52, deviceCount: 0, activeCount: 0 },
  { id: "r_kitchen",  name: "Kitchen",     icon: "Utensils",  temperature: 26.2, humidity: 58, deviceCount: 0, activeCount: 0 },
  { id: "r_bedroom",  name: "Bedroom",     icon: "BedDouble", temperature: 23.0, humidity: 50, deviceCount: 0, activeCount: 0 },
  { id: "r_kids",     name: "Kids Room",   icon: "Baby",      temperature: 23.8, humidity: 51, deviceCount: 0, activeCount: 0 },
  { id: "r_bath",     name: "Bathroom",    icon: "Bath",      temperature: 25.0, humidity: 65, deviceCount: 0, activeCount: 0 },
  { id: "r_garage",   name: "Garage",      icon: "Car",       temperature: 28.1, humidity: 48, deviceCount: 0, activeCount: 0 },
  { id: "r_outdoor",  name: "Outdoor",     icon: "Trees",     temperature: 30.4, humidity: 60, deviceCount: 0, activeCount: 0 },
];

const now = () => new Date().toISOString();

export const devices: Device[] = [
  // Living Room
  { id: "d_lr_light_1", name: "Ceiling Light",   type: "light",      roomId: "r_living",  status: "online", on: true,  powerW: 24,  level: 80, levelUnit: "%", firmware: "1.4.2", lastSeen: now() },
  { id: "d_lr_light_2", name: "Floor Lamp",      type: "light",      roomId: "r_living",  status: "online", on: false, powerW: 0,   level: 60, levelUnit: "%", firmware: "1.4.2", lastSeen: now() },
  { id: "d_lr_ac",      name: "Living AC",       type: "ac",         roomId: "r_living",  status: "online", on: true,  powerW: 1280, level: 24, levelUnit: "°C", firmware: "3.1.0", lastSeen: now() },
  { id: "d_lr_tv",      name: "Smart TV",        type: "tv",         roomId: "r_living",  status: "online", on: true,  powerW: 110, level: 35, levelUnit: "%",  firmware: "5.2.1", lastSeen: now() },
  { id: "d_lr_speaker", name: "Soundbar",        type: "speaker",    roomId: "r_living",  status: "online", on: true,  powerW: 18,  level: 40, levelUnit: "%",  firmware: "2.0.3", lastSeen: now() },
  { id: "d_lr_blinds",  name: "Window Blinds",   type: "blinds",     roomId: "r_living",  status: "online", on: true,  powerW: 0,   level: 70, levelUnit: "%",  firmware: "1.0.0", lastSeen: now() },

  // Kitchen
  { id: "d_kt_light",   name: "Kitchen Lights",  type: "light",      roomId: "r_kitchen", status: "online", on: true,  powerW: 32,  level: 100, levelUnit: "%", firmware: "1.4.2", lastSeen: now() },
  { id: "d_kt_fridge",  name: "Refrigerator",    type: "appliance",  roomId: "r_kitchen", status: "online", on: true,  powerW: 145, firmware: "1.0.0", lastSeen: now() },
  { id: "d_kt_oven",    name: "Microwave Oven",  type: "appliance",  roomId: "r_kitchen", status: "online", on: false, powerW: 0,   firmware: "1.0.0", lastSeen: now() },
  { id: "d_kt_plug",    name: "Kettle Plug",     type: "plug",       roomId: "r_kitchen", status: "online", on: false, powerW: 0,   firmware: "1.1.4", lastSeen: now() },

  // Bedroom
  { id: "d_br_light",   name: "Bedside Lamp",    type: "light",      roomId: "r_bedroom", status: "online", on: false, powerW: 0,   level: 40, levelUnit: "%", firmware: "1.4.2", lastSeen: now() },
  { id: "d_br_ac",      name: "Bedroom AC",      type: "ac",         roomId: "r_bedroom", status: "online", on: false, powerW: 0,   level: 25, levelUnit: "°C", firmware: "3.1.0", lastSeen: now() },
  { id: "d_br_fan",     name: "Ceiling Fan",     type: "fan",        roomId: "r_bedroom", status: "online", on: true,  powerW: 65,  level: 3,  levelUnit: "spd", firmware: "1.0.0", lastSeen: now() },
  { id: "d_br_thermo",  name: "Climate Sensor",  type: "sensor",     roomId: "r_bedroom", status: "online", on: true,  powerW: 0.5, battery: 78, firmware: "2.2.0", lastSeen: now() },

  // Kids Room
  { id: "d_kd_light",   name: "Kids Light",      type: "light",      roomId: "r_kids",    status: "online", on: true,  powerW: 18,  level: 50, levelUnit: "%", firmware: "1.4.2", lastSeen: now() },
  { id: "d_kd_fan",     name: "Kids Fan",        type: "fan",        roomId: "r_kids",    status: "online", on: true,  powerW: 55,  level: 2,  levelUnit: "spd", firmware: "1.0.0", lastSeen: now() },

  // Bathroom
  { id: "d_ba_light",   name: "Bath Light",      type: "light",      roomId: "r_bath",    status: "online", on: false, powerW: 0,   level: 100, levelUnit: "%", firmware: "1.4.2", lastSeen: now() },
  { id: "d_ba_geyser",  name: "Geyser",          type: "appliance",  roomId: "r_bath",    status: "online", on: false, powerW: 0,   firmware: "1.0.0", lastSeen: now() },
  { id: "d_ba_motion",  name: "Motion Sensor",   type: "sensor",     roomId: "r_bath",    status: "online", on: true,  powerW: 0.3, battery: 92, firmware: "2.2.0", lastSeen: now() },

  // Garage
  { id: "d_ga_lock",    name: "Garage Lock",     type: "lock",       roomId: "r_garage",  status: "online", on: true,  powerW: 0.4, battery: 64, firmware: "1.5.0", lastSeen: now() },
  { id: "d_ga_camera",  name: "Garage Camera",   type: "camera",     roomId: "r_garage",  status: "online", on: true,  powerW: 6,   firmware: "4.0.1", lastSeen: now() },
  { id: "d_ga_light",   name: "Garage Light",    type: "light",      roomId: "r_garage",  status: "warning", on: false, powerW: 0,  level: 100, levelUnit: "%", firmware: "1.3.9", lastSeen: now() },

  // Outdoor
  { id: "d_od_camera",  name: "Front Camera",    type: "camera",     roomId: "r_outdoor", status: "online", on: true,  powerW: 7,   firmware: "4.0.1", lastSeen: now() },
  { id: "d_od_light",   name: "Porch Light",     type: "light",      roomId: "r_outdoor", status: "offline", on: false, powerW: 0,  level: 100, levelUnit: "%", firmware: "1.3.9", lastSeen: now() },
  { id: "d_od_lock",    name: "Front Door",      type: "lock",       roomId: "r_outdoor", status: "online", on: true,  powerW: 0.4, battery: 81, firmware: "1.5.0", lastSeen: now() },
];

// Re-compute room counts from the device list so they're always consistent.
for (const r of rooms) {
  const inRoom = devices.filter((d) => d.roomId === r.id);
  r.deviceCount = inRoom.length;
  r.activeCount = inRoom.filter((d) => d.on).length;
}

export const scenes: Scene[] = [
  { id: "s_morning",   name: "Good Morning", icon: "Sunrise", description: "Lights up, blinds open, coffee on", deviceCount: 5, active: false },
  { id: "s_movie",     name: "Movie Night",  icon: "Film",    description: "Dim lights, TV on, AC at 22°C",     deviceCount: 4, active: false },
  { id: "s_dinner",    name: "Dinner",       icon: "Utensils",description: "Warm lights, soft music",           deviceCount: 3, active: false },
  { id: "s_sleep",     name: "Goodnight",    icon: "Moon",    description: "Lights off, doors locked, AC eco",  deviceCount: 8, active: false },
  { id: "s_away",      name: "Away",         icon: "Plane",   description: "All off, cameras armed",            deviceCount: 12, active: false },
  { id: "s_party",     name: "Party",        icon: "PartyPopper", description: "Colour lights, music, AC cool", deviceCount: 6, active: false },
];

export const automations: Automation[] = [
  { id: "a_sun",   name: "Sunset Lights",        description: "Turn on porch and living-room lights at sunset", enabled: true,  trigger: "Daily at sunset",          lastRun: new Date(Date.now() - 18 * 3600e3).toISOString() },
  { id: "a_eco",   name: "Eco AC",                description: "Raise AC to 26°C between 1pm and 3pm",         enabled: true,  trigger: "Daily 13:00 – 15:00",       lastRun: new Date(Date.now() -  4 * 3600e3).toISOString() },
  { id: "a_away",  name: "Away Mode",             description: "Activate Away scene when no one is home for 20m", enabled: true,  trigger: "No motion for 20 min",  lastRun: new Date(Date.now() - 26 * 3600e3).toISOString() },
  { id: "a_water", name: "Geyser Pre-heat",       description: "Heat geyser 6:30 AM weekdays",                enabled: false, trigger: "Mon-Fri 06:30",             lastRun: new Date(Date.now() - 92 * 3600e3).toISOString() },
  { id: "a_fan",   name: "Bedroom Fan Off",       description: "Turn off bedroom fan when no motion for 15m",  enabled: true,  trigger: "No motion 15 min",          lastRun: new Date(Date.now() -  7 * 3600e3).toISOString() },
];
