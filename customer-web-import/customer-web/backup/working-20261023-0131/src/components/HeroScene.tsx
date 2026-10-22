import Icon from "./Icon";

export default function HeroScene() {
  return (
    <div className="scene">
      <svg viewBox="0 0 520 440" className="scene-svg" aria-hidden="true" focusable="false">
        <ellipse className="blob" cx="260" cy="210" rx="210" ry="185" />
        <ellipse className="shadow" cx="260" cy="392" rx="160" ry="14" />

        <path id="route" className="route" d="M40 384 Q260 300 480 384" />

        <g className="slice">
          <path d="M52 262 Q98 226 144 262 L98 342 Z" className="f-cheese" />
          <path d="M52 262 Q98 226 144 262" className="crust" />
          <circle cx="92" cy="272" r="7" className="f-tomato" />
          <circle cx="116" cy="296" r="6" className="f-tomato" />
        </g>

        <g className="burger">
          <path d="M166 190 C166 118 354 118 354 190 Z" className="f-bun" />
          <circle cx="216" cy="150" r="4" className="f-sesame" />
          <circle cx="260" cy="138" r="4" className="f-sesame" />
          <circle cx="304" cy="150" r="4" className="f-sesame" />
          <path
            d="M158 196 Q170 212 182 196 Q194 212 206 196 Q218 212 230 196 Q242 212 254 196 Q266 212 278 196 Q290 212 302 196 Q314 212 326 196 Q338 212 350 196 L354 206 L158 206 Z"
            className="f-leaf"
          />
          <path
            d="M156 208 L356 208 L356 222 Q342 236 328 222 Q314 236 300 222 Q286 236 272 222 L156 222 Z"
            className="f-cheese"
          />
          <rect x="162" y="224" width="188" height="26" rx="10" className="f-patty" />
          <rect x="166" y="252" width="180" height="10" rx="5" className="f-tomato" />
          <path d="M166 264 L354 264 Q354 292 330 292 L190 292 Q166 292 166 264 Z" className="f-bun" />
        </g>

        <circle className="dot f-tomato" cx="420" cy="140" r="7" />
        <circle className="dot f-leaf" cx="112" cy="150" r="6" />
        <circle className="dot f-cheese" cx="436" cy="250" r="6" />
        <circle className="dot f-brand" cx="84" cy="212" r="5" />

        <g>
          <circle className="pulse f-brand" cx="480" cy="384" r="10" />
          <circle className="f-brand" cx="480" cy="384" r="9" />
          <circle className="f-surface" cx="480" cy="384" r="3" />
        </g>

        <g className="scooter">
          <animateMotion dur="9s" repeatCount="indefinite">
            <mpath href="#route" />
          </animateMotion>
          <rect x="-18" y="-22" width="26" height="16" rx="3" className="f-brand" />
          <path d="M8 -12 L18 -12 L22 -2 L8 -2 Z" className="scooter-body" />
          <circle cx="-10" cy="4" r="6" className="wheel" />
          <circle cx="14" cy="4" r="6" className="wheel" />
        </g>
      </svg>

      <div className="chipf a">
        <Icon name="clock" size={20} />
        <div>
          <strong>Fast delivery</strong>
          <small>Live tracking on every order</small>
        </div>
      </div>
      <div className="chipf b">
        <Icon name="star" size={20} />
        <div>
          <strong>Loved by diners</strong>
          <small>Top-rated local kitchens</small>
        </div>
      </div>
      <div className="chipf c">
        <Icon name="bike" size={20} />
        <div>
          <strong>Rider on the way</strong>
          <small>Follow every step</small>
        </div>
      </div>
    </div>
  );
}
