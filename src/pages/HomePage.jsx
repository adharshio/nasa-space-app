import { useState } from "react";
import { ArrowRight, Orbit, Rocket, Satellite } from "lucide-react";
import "./HomePage.css";

export default function HomePage({ onStartMission }) {
  const [destination, setDestination] = useState("Moon");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [launching, setLaunching] = useState(false);

  function enterMission(e) {
    e.preventDefault();
    const astronautName = name.trim();
    if (!astronautName) { setError("Enter your astronaut name to continue."); return; }
    setError("");
    setLaunching(true);
    window.setTimeout(
      () => onStartMission({ astronautName, destination, mission: destination === "Moon" ? "Lunar Outpost: First Light" : "Red Frontier: Beyond Earth" }),
      900,
    );
  }

  if (launching) {
    return (
      <main className={`simple-launch-screen destination-${destination.toLowerCase()}`}>
        <div className="simple-stars" />
        <div className="simple-launch-content">
          <div className="launch-icon"><Rocket size={38} /></div>
          <p className="simple-kicker">ASTRA SPACE PROGRAM</p>
          <h1>Preparing your mission</h1>
          <p>{name.trim()} · {destination === "Moon" ? "Lunar surface" : "Mars"}</p>
          <div className="simple-loading"><span /></div>
        </div>
      </main>
    );
  }

  return (
    <main className={`astra-home destination-${destination.toLowerCase()}`}>
      <div className="astra-stars" aria-hidden="true" /><div className="astra-frame" aria-hidden="true" />
      <header className="astra-nav">
        <div className="astra-nav-brand"><Orbit size={17} /> ASTRA</div>
        <nav aria-label="Main navigation">
          <a className="current" href="#home">HOME</a>
          <a href="#about">ABOUT</a>
          <a href="#colonies">COLONIES</a>
          <a href="#planets">PLANETS</a>
        </nav>
        <span className="astra-nav-status"><i /> MISSION SYSTEM ONLINE</span>
      </header>
      <div className="astra-planet" aria-hidden="true" /><div className="astra-orbit" aria-hidden="true" /><div className="astra-satellite" aria-hidden="true"><Satellite size={22} /></div>
      <section className="astra-main" id="home">
        <p className="astra-overline">YOUR JOURNEY BEYOND EARTH BEGINS HERE</p><h1>ASTRA</h1><p className="astra-subtitle">ASTRONAUT SIMULATION &amp; SPACE EXPLORATION</p>
        <div className="astra-destination-label" id="planets">SELECT YOUR DESTINATION</div>
        <div className="astra-destination-switch" role="group" aria-label="Choose destination">
          <button type="button" onClick={() => setDestination("Moon")} className={destination === "Moon" ? "selected" : ""} aria-pressed={destination === "Moon"}><span className="mini-planet mini-moon" /><span><strong>LUNAR</strong><small>THE MOON</small></span>{destination === "Moon" && <b>SELECTED</b>}</button>
          <button type="button" onClick={() => setDestination("Mars")} className={destination === "Mars" ? "selected" : ""} aria-pressed={destination === "Mars"}><span className="mini-planet mini-mars" /><span><strong>MARS</strong><small>THE RED PLANET</small></span>{destination === "Mars" && <b>SELECTED</b>}</button>
        </div>
        <form className="astra-entry" onSubmit={enterMission}>
          <label htmlFor="astronaut-name">ASTRONAUT NAME</label>
          <div className="astra-input-wrap">
            <input id="astronaut-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Enter your callsign" autoComplete="off" />
            <span>✦</span>
          </div>
          {error && <p className="astra-error" role="alert">{error}</p>}
          <button className="astra-enter" type="submit">ENTER MISSION <ArrowRight size={17} /></button>
        </form>
      </section>
      <aside className="astra-side-info astra-left-info"><span className="side-info-title">DESTINATION</span><strong>{destination === "Moon" ? "LUNA" : "MARS"}</strong><small>{destination === "Moon" ? "384,400 KM FROM EARTH" : "225M KM AVG. FROM EARTH"}</small><div className="side-divider" /><span className="side-info-title">MISSION TYPE</span><strong>EXPLORATION</strong></aside>
      <aside className="astra-side-info astra-right-info"><span className="side-info-title">MISSION STATUS</span><strong className="status-ready">READY</strong><small>AWAITING ASTRONAUT</small><div className="side-divider" /><span className="side-info-title">PROGRAM</span><strong>ASTRA-01</strong></aside>
      <footer className="astra-footer"><span>ASTRA SPACE EXPLORATION PROGRAM</span><span>CHOOSE · PREPARE · EXPLORE</span><span>V 1.0.0</span></footer>
    </main>
  );
}
