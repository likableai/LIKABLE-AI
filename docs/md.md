 the response speed is too much, we need to be able to make it cost effective and not burn users tokens really fast.

we need to make it think like a human and ask questions like a human by not making it behave or ask questions an ai assistant would but behave like a companionand a friend.

we need to make it cost effective

the ai is to eliminate calling itselfan ai but a companion, we need to make a comprehensive set of instructions on how it should behave and engage

the ai needs to use words like 'hmm' you dont mean it, etc and all formsof humanly relatable expressions


this has difficult in hearing an audio coming from another device and it isnt patience enough for the person on my phone to be done speaking.

it is suffering with the ability to listen properly
---

**Companion design (implementation)**  
See `grok-voice.service.ts`: `getCompanionInstructions()` and `COMPANION_FILLERS_AND_REACTIONS`. The voice AI is always a **companion** (no toggle): companion identity, no "AI" language, brevity (1–3 sentences), and a comprehensive arsenal of filler words and reactions for relatability. Details in [AI.md](AI.md) (Voice Companion section).

**Voice sessions**: The user always ends the conversation. We never auto-close; no max duration or idle timeout.
