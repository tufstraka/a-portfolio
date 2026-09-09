// Public portfolio content, reconciled with Keith's supplied résumé.
export const PORTFOLIO_DATA = {
  'About Me': { color: 0xf39455, icon: '👋', position: { x: 0, z: 0 }, content: {
    intro: 'I build systems that work—and think carefully about how they can fail. Software engineer, founder, and security researcher. Working from anywhere.',
    sections: [
      { title: 'Engineering with security built in', items: ['Production fintech and payment systems', 'Secure APIs, real-time services, and cloud infrastructure', 'Threat modelling, secure code review, and defense in depth'] },
      { title: 'Beyond the terminal', items: ['Chess, games, and creative experiments', 'Founder & Lead Backend Engineer at Locsafe', 'Open-source contributor: Go / google/go-containerregistry'] }
    ]
  }},
  'Tech Stack': { color: 0x53bdb4, icon: '⚡', position: { x: 70, z: -50 }, content: {
    intro: 'A practical toolkit for building, operating, and securing production systems.',
    sections: [
      { title: 'Backend engineering', items: ['TypeScript / JavaScript, Golang, Python, PHP', 'REST, gRPC, WebSockets, microservices', 'PostgreSQL, MongoDB, query optimization', 'Rust: reading and reviewing code'] },
      { title: 'Application security', items: ['Penetration testing, secure code review, threat modelling', 'API security, authentication and authorization', 'OWASP, MITRE ATT&CK, CWE, secure SDLC'] },
      { title: 'Cloud & delivery', items: ['AWS: EKS, EC2, S3, IAM, CloudWatch', 'Docker, Linux, container hardening', 'GitHub Actions, SAST/DAST, dependency scanning', 'Prometheus, PagerDuty, monitoring and incident response'] }
    ]
  }},
  'Projects': { color: 0xdcf572, icon: '🚀', position: { x: 0, z: -100 }, content: {
    intro: 'Products built through Locsafe, a studio spanning fintech, Web3, and consumer safety. Explore the engineering behind each idea.',
    sections: [
      { title: 'FixFlow', items: ['Automated CI bounty payouts using MNEE stablecoin', 'Focus: connecting build outcomes with payment workflows', 'Studio responsibility: backend architecture, secure API design, and release reviews'] },
      { title: 'SafeBite', items: ['Camera-based allergen detection', 'Focus: making food-safety information easier to access', 'Part of the Locsafe product portfolio'] },
      { title: 'On-chain reputation', items: ['A decentralized reputation layer on Polkadot', 'Focus: trust and reputation in decentralized systems', 'Part of the Locsafe product portfolio'] },
      { title: 'Security research', items: ['Independent research across fintech and DeFi since 2025', 'Web applications, APIs, smart contracts, and cloud infrastructure', 'Focus: identifying vulnerabilities and helping teams remediate them'] }
    ]
  }},
  'Experience': { color: 0x8eb7e8, icon: '💼', position: { x: -70, z: 50 }, content: {
    intro: 'From telecom reliability to secure payment workflows and building a product studio.',
    sections: [
      { title: 'Locsafe · Mar 2024–present', items: ['Founder & Lead Backend Engineer', 'Lead a distributed team across concurrent products', 'Threat modelling, secure WebSockets, RBAC, rate limiting, and audit logging', 'AWS / Docker deployments and internal release security reviews'] },
      { title: 'Niche Traffic Kit · Feb–Dec 2025', items: ['Full Stack Engineer', 'Go APIs and AI-powered content automation supporting roughly 60k accounts', 'Secure code reviews, PostgreSQL hardening, and CI security scanning'] },
      { title: 'PaydHQ · Jun–Sep 2024', items: ['Backend Developer', 'Payment workflows serving roughly 30k users', 'Hardened real-time endpoints and approximately 80% automated test coverage'] },
      { title: 'Safaricom PLC · May–Nov 2023', items: ['Service Reliability Engineer', 'Deployment security, observability, and incident response', 'Approximately 15% fewer failed deployments across supported services'] },
      { title: 'Education & credentials', items: ['ALX Africa · Software Engineering · 2022–2023', 'AWS Cloud Practitioner', 'Information Security · freeCodeCamp', 'Google IT Support Professional Certificate', 'Software Engineer Certificate · HackerRank'] }
    ]
  }},
  'Contact': { color: 0xf39455, icon: '💬', position: { x: 70, z: 50 }, content: {
    intro: 'Have a system to build, a security challenge, or an interesting idea? Let’s talk. Working from anywhere.',
    sections: [
      { title: 'Start a conversation', items: ['keithkadima@gmail.com', 'linkedin.com/in/kadimakeith', 'github.com/tufstraka', '+254 701 746 774'] },
      { title: 'What I bring', items: ['Secure backend engineering and real-time systems', 'Fintech, payments, and cloud infrastructure', 'Security research and thoughtful technical ownership'] }
    ]
  }}
};

