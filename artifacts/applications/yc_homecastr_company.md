# YC Application - Company Section (Homecastr)

Here are the finalized answers for the Company section of your YC application. You can copy and paste these directly into the corresponding text boxes.

***

**Who writes code, or does other technical work on your product? Was any of it done by a non-founder?**
> I write all the code myself: the PyTorch diffusion model, the data ingestion pipelines, the FastAPI backend, and the Next.js frontend. No contractors or non-founders have contributed any code or technical work.

**Are you looking for a cofounder?**
> Yes. As a highly technical founder, I can build and ship the core ML product end-to-end solo. However, I am actively looking for a co-founder with deep distribution and growth expertise in consumer real estate or PropTech to balance out the team and scale our go-to-market efforts.

**Company name**
> Homecastr

**Describe what your company does in 50 characters or less.**
> Reliable 4-year trajectories beating Zillow

**What is your company going to make? Please describe your product and what it does or will do.**
> Homecastr delivers probabilistic, parcel-level home price forecasts nationwide. Our transformer-based diffusion model matches Zillow's 1-year accuracy while uniquely delivering stable 15% median error over a 4-year horizon. Consumers get P10/P50/P90 price trajectories with statistically validated 90%+ coverage, not point estimates.

**Where do you live now, and where would the company be based after YC?**
> New York, NY, US / New York, NY, US

**Explain your decision regarding location.**
> NYC has the densest concentration of PropTech investors (MetaProp, a16z's real estate team), institutional real estate buyers, and ML engineers in the country. Our early conversations with a16z and MetaProp happened because we were local. Staying here keeps us close to capital and customers.

**How far along are you?**
> The product is live. Our logs show 6,500+ monthly automated API requests from data platforms, proving immediate demand for a B2B tier. We also have hundreds of organic consumer MAUs validating the core product. The full pipeline is deployed end-to-end: nationwide parcel-level property records aggregation, model training, and web delivery. We've gotten direct product feedback from a16z and MetaProp that shaped the current iteration.

**How long have each of you been working on this? How much of that has been full-time?**
> I started building Homecastr in April 2025 and have been full-time on it since day one. Before that, I spent a year on PoliBOM (a YC-interviewed AI tariff platform) and two years on Summit Geospatial (elevation data infrastructure), both of which sharpened the ML architecture I now use here.

**What tech stack are you using, or planning to use, to build this product? Include AI models and AI coding tools you use.**
> ML: Python, PyTorch (FT-Transformer diffusion architecture), PostgreSQL, Redis, FastAPI, Modal A100 GPUs. Frontend: TypeScript, React, Next.js. AI coding tools: Cursor with Claude 3.5 Sonnet. I also built a custom Playwright-based agentic framework to automate repetitive ops tasks.

**Why did you pick this idea to work on? Do you have domain expertise in this area? How do you know people need what you're making?**
> I spent 5 years building nationwide spatial ML models at TACC ($40M disaster resiliency initiative). Consumer real estate still relies on outdated point-estimate models like Zestimates that break over long horizons. Hundreds of consumer MAUs use our trajectories organically, while thousands of automated scrapers are currently vacuuming up our data, proving immediate B2B monetization potential.

**Who are your competitors? What do you understand about your business that they don't?**
> Legacy B2B AVM (Automated Valuation Model) providers like CoreLogic and HouseCanary. Their models optimize for point-in-time accuracy and fail at long-horizon reliability. Unlike static point-estimate models, we account for how neighborhoods change over time and forecast accordingly with diffusion-based uncertainty. They give institutions a single number; we give them a statistically validated distribution.

**How do or will you make money? How much could you make?**
> Free tier drives user growth with baseline forecasts. Premium ($20/mo) unlocks 4-year horizons, deep analytics, and API access for investors. Phase 2 is B2B API licensing to brokerages and institutional investors. Even a small slice of Zillow's 200M+ monthly users at $20/mo is a $100M+ ARR business.

***
## Missed / Unanswered Fields

**Are people using your product?**
> Yes

**How many active users or customers do you have? How many are paying? Who is paying you the most, and how much do they pay you?**
> We have hundreds of organic consumer MAUs. More critically, our server logs show 6,500+ monthly automated requests from data scrapers vacuuming up our trajectories. We are currently pre-revenue with zero paying users, as the consumer tier is completely free. We are leveraging this scraping activity as validation to launch our paid B2B API tier.

**If you are applying with the same idea as a previous batch, did anything change? If you applied with a different idea, why did you pivot and what did you learn from the last idea?**
> Applied previously with PoliBOM (reached YC interview). Enterprise compliance sales cycles were too slow for early-stage traction. I pivoted to consumer real estate because the data is public, the feedback loop is fast, and my transformer-based diffusion model matches Zillow's 1-year benchmark while outperforming on 4-year reliability.

**If you had any other ideas you considered applying with, please list them.**
> Licensing this spatial diffusion model to insurance companies for localized climate risk pricing. I chose consumer PropTech first because the feedback loop is weeks, not years, and I can prove product-market fit before taking on enterprise sales.

**Have you formed ANY legal entity yet?**
> No

**If you have not formed the company yet, describe the planned equity ownership breakdown...**
> Daniel Hardesty Lewis (CEO/CTO): 100%. If I successfully recruit a growth-focused co-founder before or during the batch, I expect to distribute equity equitably to reflect their go-to-market impact.

**Have you taken any investment yet?**
> No

**Are you currently fundraising?**
> No

**Please provide any relevant details about your current fundraise.**
> We are not actively raising an outside round. I am applying exclusively to YC to secure the network and operational pressure needed to launch the B2B API and scale distribution.

**What convinced you to apply to Y Combinator? Did someone encourage you to apply? Have you been to any YC events?**
> I applied because I need the YC network and operational pressure to launch our B2B API and scale distribution faster than I can solo. Yes, Jared Friedman encouraged me to apply after we corresponded about Homecastr. No, I have not attended any YC events.

**How did you hear about Y Combinator?**
> Hacker News

***
## Founder Video Script
*Record yourself speaking clearly and calmly. This script is ~150 words and should take exactly 60 seconds to read at a normal pace.*

"I'm Daniel, founder of Homecastr. I spent five years at the Texas Advanced Computing Center leading spatial ML for disaster resiliency. Consumer real estate still relies on outdated point-estimate models like Zillow's Zestimate, which completely fail to capture long-term spatial market dynamics.

I built a transformer-based diffusion model that accounts for how neighborhoods change over time. Homecastr matches Zillow's one-year accuracy but uniquely holds a stable 15% median absolute error over four years.

The product is live, and our logs show 6,500+ monthly automated requests from data platforms, proving immediate demand for a B2B API tier. I built the entire stack myself: ML, backend, frontend. I'm applying to YC because I need the network and pressure to match my engineering speed with real distribution, and to find a co-founder on the growth side. Thanks."
