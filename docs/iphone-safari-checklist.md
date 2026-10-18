# iPhone / Safari acceptance checklist

**Local Functions preview (LAN):** `http://10.0.0.9:8788/`  
**Working directory:** `/Users/mojsa/Desktop/Puppy Website`  
**Start command:**

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22.19.0
cd "/Users/mojsa/Desktop/Puppy Website"
npm run preview:phone
```

Put the Mac and iPhone on the same trusted Wi-Fi. Keep the preview terminal running. Open the LAN URL in Safari (not `localhost` or `0.0.0.0`).

If connection fails: check the active interface IP, firewall permission for Node/Wrangler, VPN routing, and guest-network isolation.

## Checklist (do not submit forms)

| Area | Action | Expected result | Result |
| --- | --- | --- | --- |
| Mobile menu | Open from top and after scrolling; close by button, backdrop, and navigation. Follow Frenchie Color Lab. | Backdrop covers intended area; Color Lab shows Coming soon and opens holding page. | Pending |
| Browser controls | Open/close menu with Safari address bar expanded and collapsed. | Drawer height and close controls remain usable. | Pending |
| Rotation | Rotate portrait/landscape with menu open and closed. | No clipped controls, horizontal overflow, or stranded overlay. | Pending |
| Navigation/Back | Visit a puppy, another page, then Back/Forward. | Usable state; no frozen controls. | Pending |
| Listing/cards | Inspect all five puppies and button rows. | Consistent spacing; correct status; no inline expansion. | Pending |
| Detail routes | Open and refresh all five puppy URLs. | Correct puppy, lead image, DOB, age, trait wording, inquiry link. | Pending |
| Galleries | Next/previous and thumbnails, including rapid taps. | Correct image; stable frame. | Pending |
| Inquiry preselection | Follow each puppy’s inquiry link. | Correct puppy selected; do not submit. | Pending |
| Newsletter layout | Focus email field; show/hide keyboard; rotate. | Footer remains readable. | Pending |
| Motion | Menu/page/gallery; reduced motion if available. | No disruptive flicker. | Pending |
| Page framing | Listing, detail facts, contact, inquiry edges. | Consistent gutters; no horizontal scroll. | Pending |
| Revised content | Home intro, personalities, FAQ, Color Lab. | Copy fits; Coming soon badges wrap; no homepage FAQ accordion. | Pending |

**Device / iOS / Safari / date:** _pending owner pass_  
**Overall:** Pending real iPhone/Safari (desktop Playwright WebKit is not a substitute).
