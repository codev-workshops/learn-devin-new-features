# Lab 14 injectors

All injectors are offline and reversible; nothing here touches a live Outpost.

| Injector                  | Apply                                                                                                                                     | What the learner should notice                                         | Undo                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------- |
| `claim-race.json`         | `node labs/14-outposts/tools/outpost-sim.mjs scenario labs/14-outposts/injectors/claim-race.json`                                         | 409 for the loser; release puts S1 back in the queue; nobody runs it twice | nothing to undo         |
| `shared-acceptor-id.json` | `node labs/14-outposts/tools/outpost-sim.mjs scenario labs/14-outposts/injectors/shared-acceptor-id.json`                                 | the second container is rejected; S2 waits                              | nothing to undo         |
| `no-chrome.Dockerfile`    | `node labs/14-outposts/tools/outpost-sim.mjs check-dockerfile labs/14-outposts/injectors/no-chrome.Dockerfile`                            | `chrome` rule fails; browser work would fail on this worker            | use `outpost/Dockerfile` |
| `baked-token.Dockerfile`  | `node labs/14-outposts/tools/outpost-sim.mjs check-dockerfile labs/14-outposts/injectors/baked-token.Dockerfile`                          | `no-token` and `no-sudo` rules fail                                    | use `outpost/Dockerfile` |
| token lost                | Tell the learner the token from Outpost creation was pasted in a chat and nobody saved it                                                 | it is shown once: rotate (create a new token), store it in the secret manager | —                       |
| worker down at night      | `node labs/14-outposts/tools/outpost-sim.mjs scenario labs/14-outposts/fixtures/worker-down.json`                                         | session waits instead of failing; restart policy recovers it           | nothing to undo         |
