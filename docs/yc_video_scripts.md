# Y Combinator Video Scripts: Homecastr

Based on your application, here are the direct, high-signal scripts for both required videos. The tone is kept strictly professional, technical, and free of filler (no "LLMese").

## 1. Founder Video (1 Minute)
**Target Length:** ~60 seconds (158 words)
**Goal:** Prove technical competency, highlight the core problem with legacy models, and demonstrate immediate B2B demand via your scraper logs.

**Script:**
> "Hi, I'm Daniel Hardesty Lewis, solo founder of Homecastr. Before this, I spent five years at TACC building nationwide spatial ML models for a $40 million disaster resiliency initiative.
>
> I built Homecastr because the real estate industry still relies on static point-estimate models, like Zestimates, which structurally fail over long horizons. To fix this, I trained a transformer-based diffusion model that matches Zillow's 1-year accuracy, but uniquely maintains a stable 15% median error over a 4-year horizon. Instead of a single flawed number, we output P10, P50, and P90 probabilistic trajectories.
>
> The product is live. We have hundreds of organic consumer MAUs, but the real signal is in our server logs: we're seeing over 6,500 monthly automated API requests from data scrapers vacuuming up our forecasts. That immediate B2B demand is why I'm applying to YC. I can build the core ML end-to-end, but I'm looking for a go-to-market co-founder to scale our enterprise API tier."

---

## 2. Product Demo Video (Maximum 3 Minutes)
**Target Length:** ~2 minutes (290 words)
**Goal:** Show the frontend briefly, explain the architecture, and then heavily emphasize the B2B API traction (the scrapers) to prove enterprise viability.

**Visual Flow & Script:**

**[Visual: Screen recording starts on the Homecastr consumer web app frontend. Focus on the search bar.]**
> "Hi, I'm Daniel, founder of Homecastr. Today I'll show you how our product delivers reliable, 4-year home price trajectories.

**[Visual: Pull up a property in Austin or NYC. The dashboard loads the dynamic chart showing P10/P50/P90 trajectories.]**
> "When you look at legacy AVMs like Zillow, they give you a single point-estimate that gives a false sense of certainty and degrades rapidly over time. Instead, Homecastr outputs a statistically validated probabilistic distribution. You're looking at the P10, P50, and P90 price trajectories for this specific parcel over the next four years."

**[Visual: Hovering over the chart at different time steps, showing the diverging probability bands.]**
> "You can see how the uncertainty bands widen over time. This is driven by our FT-Transformer diffusion model, which captures spatial neighborhood dynamics that static models miss. This allows us to maintain a stable 15% median error all the way out to a 4-year horizon."

**[Visual: Briefly show the hosted API documentation on your site, then switch to a terminal or Postman making a live API call for a parcel.]**
> "While our consumer dashboard is free, our core product is the underlying data. Institutional buyers and PropTech platforms can access these same probabilistic distributions programmatically via our B2B API."

**[Visual: Showing the actual JSON response returning the trajectory data array.]**
> "They pass in a parcel ID, and instantly receive the full P10/P50/P90 payload. They use this distribution to accurately price risk, stress-test portfolios, and underwrite acquisitions over long horizons—something they simply cannot do with Zillow's single number."

**[Visual: Final shot of the Homecastr map view or back to founder on camera.]**
> "Thanks for watching."
