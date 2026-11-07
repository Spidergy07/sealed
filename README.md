# Sealed

Packing-bench copilot for people who sell used gear through PayPal Goods & Services. Before the box is taped, your phone reads the shipping label and the buyer's messages and stops the one mistake that would make the sale ineligible for PayPal Seller Protection. Tracking goes straight into the PayPal order, and if a dispute arrives, the same record becomes an evidence pack you approve with one tap.

Built for the PayPal AI Hackathon 2026. Work in progress.

## Setup

```bash
cp .env.example .env.local   # fill in sandbox credentials
npm install
npm run dev
```

## Day-0 sandbox checks

```bash
node --env-file=.env.local scripts/day0.mjs token
node --env-file=.env.local scripts/day0.mjs orders              # then approve each link as the sandbox buyer
node --env-file=.env.local scripts/day0.mjs all-after-approve
```

Results are logged with PayPal debug IDs in `docs/sandbox-findings.md`.

## License

MIT
