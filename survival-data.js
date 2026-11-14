/* JEZERO - survival-data.js : the facts and scenarios for Section 8.
   REAL facts are marked with a source. Scenarios and effects are invented for teaching. */
window.JZS = {
  src: {
    nasa: { t: "NASA Mars facts", u: "https://science.nasa.gov/mars/facts/" },
    rad: { t: "Hassler et al. 2014, Science (Curiosity RAD)", u: "https://doi.org/10.1126/science.1244797" },
    perc: { t: "Davila et al. 2013 (perchlorate)", u: "https://www.cambridge.org/core/journals/international-journal-of-astrobiology/article/abs/perchlorate-on-mars-a-chemical-hazard-and-a-resource-for-humans/E4906FAD7F45A9AE8212B9198C6FD4AB" }
  },

  /* PART A: life-support systems. rank 1 = fastest to become dangerous (teaching ranking) */
  sys: [
    { n: "Pressure protection", rank: 1,
      how: "Mars's air is far too thin for people. Suits and habitats hold air in at a safe pressure, like a strong balloon around you.",
      real: "Surface pressure on Mars is only about 0.6% of Earth's at sea level.", s: "nasa",
      fail: "A leak is the fastest danger, so real designs focus on spotting and sealing leaks quickly." },
    { n: "Oxygen supply", rank: 2,
      how: "People need oxygen and must remove the carbon dioxide they breathe out. Mars's air is about 95% carbon dioxide, so oxygen has to be stored or made.",
      real: "NASA's MOXIE experiment on Perseverance made small amounts of oxygen from Mars's carbon dioxide as a test for the future.", s: "nasa",
      fail: "Oxygen falls and carbon dioxide builds up. Breathing gets harder and thinking gets worse." },
    { n: "Temperature regulation", rank: 3,
      how: "Nights are bitterly cold and days can be mild near the equator. Heaters, insulation and radiators keep the inside of suits and habitats comfortable.",
      real: "Mars's average temperature is about -60 \u00B0C. It can range from roughly -140 \u00B0C to +20 \u00B0C.", s: "nasa",
      fail: "Without heating, the inside cools toward the outside temperature and people get dangerously cold." },
    { n: "Water recycling", rank: 4,
      how: "Bringing water from Earth is heavy and costly, so a crew would clean and reuse as much as possible, such as washing water, breath moisture and waste water.",
      real: "The International Space Station already recycles most of its water. A Mars crew would need something similar.", s: "nasa",
      fail: "Stored water runs down faster. It takes days, not minutes, but it limits how long the crew can stay." },
    { n: "Radiation protection", rank: 5,
      how: "Mars has no global magnetic field and a thin atmosphere, so more space radiation reaches the ground than on Earth. Thick walls, soil on top and storm shelters reduce it.",
      real: "Curiosity measured about 0.67 millisieverts per day on the surface.", s: "rad",
      fail: "Radiation does not fail suddenly. The dose adds up over weeks and months, which raises long-term health risk." }
  ],

  /* PART B: environmental threats. pct = Mars as a percent of Earth (only where it makes sense) */
  threats: [
    { n: "Extreme temperatures", s: "nasa",
      fact: "Mars is very cold. The average is about -60 \u00B0C, and it ranges from roughly -140 \u00B0C to +20 \u00B0C. The thin air holds little heat, so the ground can warm up in the day and chill fast at night.",
      stats: [{ l: "Average temperature", m: "about -60 \u00B0C", e: "about +15 \u00B0C" }],
      means: "Suits, tools and habitats must work in deep cold and handle large swings between day and night.",
      ideas: "Insulation, heaters, and equipment tested for cold." },
    { n: "Radiation", s: "rad",
      fact: "Curiosity measured about 0.67 millisieverts per day on the surface. Earth's natural background is about 2.4 millisieverts per whole year, so the daily dose on Mars is on the order of 100 times higher.",
      stats: [{ l: "Dose rate", m: "about 0.67 mSv per day", e: "about 2.4 mSv per year" }],
      means: "The risk grows with time spent outside shelter, and the long trip to Mars adds more. Long stays need a plan for limiting the dose.",
      ideas: "Thick walls, soil piled on habitats, and shelters for solar storms." },
    { n: "Thin atmosphere", s: "nasa",
      fact: "Mars's air is about 95% carbon dioxide and its pressure is under 1% of Earth's. People cannot breathe it and could not survive in it without a pressurised suit. Gravity is also only about 38% of Earth's.",
      stats: [{ l: "Air pressure", m: "about 0.6%", e: "100%", pct: 0.6 }, { l: "Gravity", m: "about 38%", e: "100%", pct: 38 }],
      means: "Every breath of air must be carried or made, and every suit and habitat must hold pressure all the time.",
      ideas: "Pressurised suits, airlocks, and leak detection." },
    { n: "Dust storms", s: "nasa",
      fact: "Some Mars dust storms grow huge. A global storm in 2018 blocked so much sunlight that the solar-powered Opportunity rover lost contact. Winds can be fast, but the air is so thin that they push on things far less than Earth winds do.",
      stats: [{ l: "Main danger", m: "less sunlight, dirty equipment", e: "wind damage" }],
      means: "The bigger problem is power and dust, not wind force. Solar panels make less energy and can get covered.",
      ideas: "Battery reserves, low-power modes, or a power source that does not depend on sunlight." },
    { n: "Dust exposure", s: "perc",
      fact: "Martian dust is very fine and was found to contain perchlorates, a type of salt that can be harmful to people in enough quantity. How dust would affect astronauts' health has not been tested directly.",
      stats: [{ l: "Health effects on people", m: "not tested", e: "-" }],
      means: "Dust can get into suit joints, seals and filters, and would be carried indoors on suits.",
      ideas: "Airlocks that keep dust out of living areas, and filters. These are ideas, not tested results." },
    { n: "Water availability", s: "nasa",
      fact: "Liquid water cannot last on Mars's surface because the air pressure is so low. Water is found as ice, at the poles and underground. Jezero's ancient lake dried up long ago.",
      stats: [{ l: "Liquid water on the surface", m: "none that lasts", e: "common" }],
      means: "A crew would need to dig up ice, melt and clean it, and then recycle it very carefully.",
      ideas: "Mining ice, and recycling systems that lose very little." }
  ],

  /* PART C: hypothetical habitat modules */
  mods: [
    { n: "Power", t: "Makes and stores electricity for everything else.",
      w: "Solar panels and batteries are one idea. In a dust storm, panels make less power, so batteries must cover the essentials.",
      risk: "Power loss stops the air fans, heaters and pumps." },
    { n: "Life support", t: "Keeps air breathable and the temperature comfortable.",
      w: "Fans move air, filters remove carbon dioxide, and heaters and radiators control the temperature.",
      risk: "If it stops, the air gets worse and the temperature drifts." },
    { n: "Water", t: "Stores, cleans and reuses water.",
      w: "Tanks hold water and a recycler cleans used water so it can be used again.",
      risk: "Leaks and filter problems waste water that is hard to replace." },
    { n: "Food", t: "Stores meals and may grow some fresh food.",
      w: "Most food would be packed and stored. Growing plants could add variety, but needs power, light and water.",
      risk: "Spoilage or shortages mean the crew must ration." }
  ],

  /* PART D: emergency scenarios. fx: air, water, food, hp (health), sci, bud (power this sol), nb (power next sol).
     r = rating: good, ok or poor. All effects are invented for teaching. */
  scen: [
    { id: "power", n: "Habitat power failure", t: "The main power line drops out. The lights flicker and the air fans slow down.", opts: [
      { l: "Switch non-essential systems off, then repair", r: "good", fx: { bud: -1, air: -2 }, why: "Protecting air and heat first buys time to fix the problem safely." },
      { l: "Restart everything from the backup batteries", r: "ok", fx: { bud: -3, air: -4 }, why: "It works quickly, but it drains the energy you may need later." },
      { l: "Troubleshoot the fault first and leave systems as they are", r: "poor", fx: { air: -14, hp: -8 }, why: "The air fans were not running while you searched for the fault." }
    ] },
    { id: "dust", n: "Dust storm", t: "The sky darkens and the solar panels are making much less power.", opts: [
      { l: "Switch to low-power mode and wait it out", r: "good", fx: { bud: -3, nb: -1 }, why: "Cutting extras keeps the essentials running through the storm." },
      { l: "Keep everything on and use the batteries", r: "poor", fx: { bud: -1, nb: -4 }, why: "You borrowed power from tomorrow. The batteries will be empty when you need them." },
      { l: "Go outside to brush dust off the panels", r: "ok", fx: { bud: -2, hp: -10 }, why: "It may help, but dust and storm conditions put you at risk." }
    ] },
    { id: "suit", n: "Suit damage warning", t: "During outside work, the suit warns of a glove seal problem.", opts: [
      { l: "Stop work, return to the airlock and inspect", r: "good", fx: { sci: -5 }, why: "You lost some work time, but you avoided a suit failure." },
      { l: "Swap to the spare suit", r: "ok", fx: { air: -4, sci: -3 }, why: "It is safe, but changing suits uses extra air and time." },
      { l: "Tape it up and keep working", r: "poor", fx: { hp: -16 }, why: "A damaged seal can fail without warning. Never gamble with pressure." }
    ] },
    { id: "comms", n: "Communication interruption", t: "Contact with Earth drops out. Signals already take roughly 4 to 24 minutes one way, depending on where Earth and Mars are in their orbits.", opts: [
      { l: "Follow your written emergency procedures and keep logging", r: "good", fx: {}, why: "Crews must be able to act on their own because Earth cannot reply quickly." },
      { l: "Switch to the backup antenna", r: "ok", fx: { bud: -1 }, why: "It may restore contact, and costs a little power." },
      { l: "Skip the procedures and improvise a fix", r: "poor", fx: { hp: -10, air: -5 }, why: "Improvising without checking can create a second problem." }
    ] },
    { id: "water", n: "Water-system malfunction", t: "The water recycler is leaking and the tank level is dropping.", opts: [
      { l: "Isolate the leak and use stored water", r: "good", fx: { water: -8 }, why: "Stopping the leak protects the rest of your water." },
      { l: "Halve the water ration while you repair", r: "ok", fx: { water: -5, hp: -6 }, why: "It saves water, but thirst and tiredness hurt health." },
      { l: "Keep the recycler running while you repair", r: "poor", fx: { water: -22 }, why: "Running a leaking system pours your water away." }
    ] }
  ]
};
