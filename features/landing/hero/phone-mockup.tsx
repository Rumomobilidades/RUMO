import { Car, ShieldCheck } from "lucide-react"

export function PhoneMockup() {
  return (
    <div className="relative flex justify-center">
      <div
        className="absolute top-[12%] left-[12%] h-[76%] w-[76%] blur-[60px]"
        style={{
          background: "radial-gradient(circle, rgba(190,232,62,.16), transparent 68%)",
        }}
      />

      <div className="animate-floaty absolute top-[10%] left-[-6%] z-[3] flex items-center gap-2.5 rounded-2xl border border-white/15 bg-[#161c19]/85 px-4 py-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)] backdrop-blur-md max-[520px]:left-0">
        <span className="bg-rumo-lime size-2 flex-none rounded-full shadow-[0_0_8px_rgba(190,232,62,.6)]" />
        <div>
          <b className="block text-[0.76rem] tracking-[-0.01em] text-[#F2F5F2]">
            Motorista a caminho
          </b>
          <span className="block text-[0.65rem] text-[#9AA69E]">Chega em 2 min</span>
        </div>
      </div>
      <div
        className="animate-floaty absolute right-[-7%] bottom-[15%] z-[3] flex items-center gap-2.5 rounded-2xl border border-white/15 bg-[#161c19]/85 px-4 py-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)] backdrop-blur-md max-[520px]:right-0"
        style={{ animationDelay: "-3s" }}
      >
        <span className="bg-rumo-lime size-2 flex-none rounded-full shadow-[0_0_8px_rgba(190,232,62,.6)]" />
        <div>
          <b className="block text-[0.76rem] tracking-[-0.01em] text-[#F2F5F2]">
            Preço confirmado
          </b>
          <span className="block text-[0.65rem] text-[#9AA69E]">
            Sem surpresa no destino
          </span>
        </div>
      </div>

      <div className="relative z-[2] w-[min(290px,72vw)] rotate-[2.5deg] rounded-[42px] border border-white/10 bg-[#10140F] p-3 shadow-[0_0_0_9px_#181D18,0_0_0_10px_rgba(255,255,255,.07),0_46px_90px_-28px_rgba(0,0,0,.8)] transition-transform duration-500">
        <div className="relative flex aspect-[9/18.4] flex-col overflow-hidden rounded-[32px] bg-[#FBFCFB]">
          <div className="absolute top-2.5 left-1/2 z-[5] h-5 w-20 -translate-x-1/2 rounded-[11px] bg-[#101613]" />

          <div
            className="relative flex-1"
            style={{
              background:
                "radial-gradient(circle at 72% 22%, rgba(14,138,69,.06), transparent 45%), linear-gradient(rgba(16,22,19,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(16,22,19,.045) 1px, transparent 1px), #F3F6F3",
              backgroundSize: "auto, 32px 32px, 32px 32px, auto",
            }}
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 270 380"
              preserveAspectRatio="none"
            >
              <path
                d="M62 92 C 120 110, 110 200, 160 220 S 200 250, 192 248"
                fill="none"
                stroke="rgba(14,138,69,.85)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray="1 9"
              />
              <path
                d="M62 92 C 120 110, 110 200, 160 220 S 200 250, 192 248"
                fill="none"
                stroke="rgba(14,138,69,.12)"
                strokeWidth="9"
                strokeLinecap="round"
              />
            </svg>
            <span className="bg-rumo-green absolute top-[22%] left-[22%] size-3.5 rounded-full border-[3px] border-white shadow-[0_2px_8px_rgba(14,138,69,.4)]" />
            <span className="absolute top-[63%] left-[70%] size-3.5 rounded-full border-[3px] border-white bg-[#101613]" />
          </div>

          <div className="border-border flex flex-col gap-2.5 rounded-t-[20px] border-t bg-white p-4 text-[#101613]">
            <div className="mx-auto mb-0.5 h-1 w-8.5 rounded-full bg-[#DDE1DD]" />
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 flex-none place-items-center rounded-[10px] bg-[#E7F5EC]">
                <Car className="text-rumo-green size-[17px]" />
              </div>
              <div className="min-w-0 flex-1">
                <b className="block text-[0.74rem]">RUMO Conforto</b>
                <span className="text-[0.64rem] text-[#5B6660]">
                  Chega em 4 min · 8,2 km
                </span>
              </div>
              <div className="text-right text-[0.84rem] font-extrabold tracking-[-0.02em]">
                R$ 18,90
                <small className="text-rumo-green block text-[0.56rem] font-semibold">
                  preço fechado
                </small>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 flex-none place-items-center rounded-[10px] bg-[#E7F5EC]">
                <ShieldCheck className="text-rumo-green size-[17px]" />
              </div>
              <div className="min-w-0 flex-1">
                <b className="block text-[0.74rem]">Carlos · 4,98 ★</b>
                <span className="text-[0.64rem] text-[#5B6660]">
                  Motorista verificado
                </span>
              </div>
            </div>
            <button
              type="button"
              tabIndex={-1}
              className="bg-rumo-green rounded-[11px] p-2.5 text-[0.76rem] font-bold text-white"
            >
              Confirmar corrida
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
