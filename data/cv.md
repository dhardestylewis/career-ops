# Daniel Hardesty Lewis

**Staff ML Engineer** - production training, inference, evaluation, reliability

Specializing in automated validation frameworks and scalable distributed infrastructure. Delivered consumer pricing and statewide resiliency platforms across geospatial and time-series workloads.

## Core Expertise

- 8 years ML Engineering: build and operate AI/ML training and inference pipelines, using rigorous validation protocols to ensure model generalization and reliability
- 8 years Backend and Data: build schemas and ETL; ship API-backed services using Python, SQL, and Postgres/PostGIS
- 8 years Distributed Systems: scale batch workloads across distributed systems, profile bottlenecks, and optimize latency and throughput with explicit cost-performance tradeoffs
- 10 years Geospatial AI: spatiotemporal modeling for risk, planning, and hazard decision-support use cases
- 8 years Technical Leadership: drive cross-functional execution via specifications and governance; mentor engineers through design reviews, code reviews, and instruction

## Technologies

| Category | Skills |
|----------|--------|
| Modeling | PyTorch, TensorFlow, scikit-learn, Transformers, LoRA, QLoRA, PEFT |
| LLM apps | embeddings, RAG, LangChain, LangGraph, DSPy, FAISS |
| Data stack | Python, SQL, Pandas, Polars, PyArrow, Parquet, Postgres, PostGIS, Redis, Elasticsearch, Supabase |
| Infrastructure | Linux/Unix, Bash, Git, Docker, Kubernetes, Modal, GCS, Ray, Spark, Dask, Airflow, CI/CD, observability |
| Additional | CUDA, C++, TypeScript, React |

## Experience

### Homecastr, New York, NY
**Co-founder**

Nov. 2024 - Present

Consumer real-estate pricing and forecasting platform with interactive uncertainty fancharts and temporal leakage-safe expanding-window evaluation.

- Architected a nationwide tract-level diffusion forecasting model, beating Zillow's 8.4% one-year error benchmark at 8% and maintaining a stable 25% MdAE over a 4-year horizon
- Engineered architecture incorporating spatial inducing tokens, per-horizon loss normalization, and DDIM sampling to balance predictive precision with calibrated price trajectories
- Developed a probabilistic evaluation suite optimizing PIT uniformity, interval coverage, and sharpness to rigorously validate forecast reliability before production delivery
- Owned the end-to-end pipeline from data ingestion to real-time serving and refined product strategy through direct feedback from a16z and MetaProp

### PoliBOM, Seattle, WA
**Co-founder**

Nov. 2024 - Present

AI tariff mitigation and trade compliance product for manufacturers, centered on BOM analysis, retrieval, and policy scenario simulation.

- Specified an agentic workflow for BOM parsing and tariff simulation using Airflow, Elasticsearch embeddings, and FastAPI on Supabase and Redis
- Directed development of a conversational AI interface enabling decision-makers to instantly retrieve BOMs and receive proactive compliance alerts
- Executing customer discovery with ScoutyAI and Columbia economists, and secured early market validation by presenting the prototype to KPMG

### Summit Geospatial, New York, NY
**Founder**

Nov. 2023 - Present

High-resolution elevation data and web delivery for engineering and hazard workflows.

- Engineered a statewide seamless Texas DEM mosaic, resampling 0.5 m LiDAR sources to 1.2 m via nearest-neighbor across 70+ state, federal, and local elevation datasets
- Developed the web distribution platform end-to-end including data pipeline, tiling, hosting, and delivery UX to support engineering and planning use cases

### Texas Advanced Computing Center (TACC), Austin, TX
**Senior Data Scientist & Technical Lead**

Aug. 2021 - Aug. 2023

- Spun out Summit Geospatial alongside UT's VPs of IP to commercialize state-level terrain models from the $40M Texas Disaster Information System (TDIS), delivering precision decision-support for civil engineering
- Developed inter-agency RFP and MOU frameworks with state and federal partners, translating technical requirements into scope and milestones facilitating Real-Time Inundation Mapping and TDIS
- Scaled climate and flood models on supercomputers, executing 800,000-node distributed jobs while managing $1M+ compute budgets and federal partnerships with NOAA, NSF, USACE, and GLO
- Developed efficient methods to produce high-resolution 1m flood maps from National Water Model outputs for Texas Emergency Management's Real-Time Inundation Mapping
- Partnered with the US Army Corps of Engineers to statistically model compound flood hazards in coastal Texas, integrating high-resolution topographic data with hydrological models
- Contributed fundamental research supporting Paola Passalacqua's 2022 EGU Bagnold Medal, one of geomorphology's highest honors
- Served as Technical Reviewer for Frontera Doctoral Fellows (2023) and Large-Scale Computing Pathways (2022) applications, evaluating $10M+ in computing resource allocations on one of the world's largest supercomputers

### Texas Advanced Computing Center (TACC), Austin, TX
**Data Scientist & Research Engineer**

Feb. 2018 - Jul. 2021

- Competed in DARPA World Modelers to improve disaster resiliency and food security modeling in East Africa
- Mentored Petrobras engineers in deep learning and HPC to enable institutional technology transfer
- Received research recognition from AAAI President Yolanda Gil during her farewell address for contributions to automated scientific modeling

## Research

### Columbia University, New York, NY
**Research assistant to Dir. Electrical Engineering Zoran Kostic**

May 2025 - Aug. 2025

- Math benchmarking and finetuning of DeepSeek's GRPO algorithm

**Research assistant to Dir. Financial Engineering Ali Hirsa**

Jan. 2025 - Oct. 2025

- Developed a multi-asset CVAE latent factor model with Skew-T Mixture priors; achieved 85% R2 vs. commercial SaaS (75%) and Fama-French (58%) on backtested holdout
- Derived a tractable, axiom-compliant per-feature SHAP algorithm using Hessian-based recursive clustering to provide stable temporal regime-dependent attributions for deep learning models

### University of Southern California, Los Angeles, CA
**Summer research intern to Pres. AAAI Yolanda Gil**

Jul. 2019 - Aug. 2019

- Integrated hydrological models into the MINT Platform during a year-long competition with MITRE to provide DARPA the "Airflow for science"

## Teaching

### The University of Texas at Austin
**Co-instructor**

Jan. 2018 - Dec. 2020

- Helped design and teach graduate-level courses: Machine Learning for the Geosciences for Petrobras engineers, Intelligent Systems for the Geosciences, and Scientific Computation

## Select Publications

- 2021 Gil, Y., et al. (incl. D. Hardesty Lewis), "Artificial Intelligence for Modeling Complex Systems: Taming the Complexity of Expert Models to Improve Decision Making". ACM TiiS, 2021. DOI: 10.1145/3453172
- 2019 Garijo, D., et al. (incl. D. Hardesty Lewis), "An intelligent interface for integrating climate, hydrology, agriculture, and socioeconomic models". ACM IUI'19, 2019. DOI: 10.1145/3308557.3308711

## Education

- expected 2026 M.S., Urban Planning, Columbia University, New York City, NY
- 2017 B.S., Pure Mathematics, University of Texas, Austin, TX

## Key Projects

- **oppsAlert**: Developed the first property- and owner-level ML model of NIMBYism, using 15+ years of 15,000+ points of individual homeowner protest data provided by the City of Austin
- **M&A predictor**: Built M&A prediction model (Oct.-Dec. 2025) with Prof. Eric Talley on 1.5M Compustat firm-quarters; long-only portfolio beat S&P 500 by 2%/yr (2004-2020), peaking at 6%/yr

## Activities

- Sailing
- Volunteer Atlantic SAR of the Cheeki Rafiki
- Bikepacking US West and East Coasts

## Languages

- Spanish - Native Proficiency
- French - Professional Working Proficiency
