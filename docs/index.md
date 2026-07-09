---
layout: home
heroCarousel: true

hero:
    name: "PrintBridge"
    text: "A local print agent that bridges web applications and printers."
    tagline: An open-source local print Agent that runs on the user's computer. Trusted ERP, WMS, OMS, and POS systems can connect to the local Agent through the SDK and submit PDF, image, Office, and raw print jobs to the system print queue.
    actions:
        - theme: brand
          text: Download PrintBridge
          link: /download
        - theme: alt
          text: View SDK Integration
          link: /guide/sdk

features:
    - title: Local Agent
      details: PrintBridge stays on the user's computer, receives jobs, verifies origins, downloads or converts files, and submits them to the system print queue.
    - title: Browser JSSDK
      details: Web pages connect to the local WebSocket service through print-bridge-sdk and submit single or batch print jobs.
    - title: Multiple Print Formats
      details: Supports PDF, PNG/JPEG images, Office files, and raw commands such as ESC/POS, TSPL, ZPL, EPL, and PCL.
    - title: Enterprise Deployment
      details: Origin/IP allowlists, remote task polling, CLI operations, and encrypted configuration import/export make it suitable for warehouses, stores, and workstations.
    - title: Remote Print Tasks
      details: Your business server creates tasks centrally. The local Agent polls, downloads, queues, prints, and reports accepted, success, or failed status back to the server.
    - title: Open Source and Private Deployment
      details: Self-hostable, auditable, and extensible for integrating with your own ERP, WMS, OMS, or POS systems.
---
