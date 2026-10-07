'use client'

import { useSyncExternalStore } from 'react'
import { Hand, Volume2, VolumeX } from 'lucide-react'

const getServerSound = () => 'pending'

const SOUND_LABEL = {
  on: 'Mute',
  pending: 'Sound on', // browser is holding sound back until the first interaction
  off: 'Sound on',
}

/*
 * - Transparent tap surface for touch devices (desktop hover zones are handled on the
 *   <section>, so this layer never needs to intercept mouse movement).
 * - Keyboard equivalent of the greeting, visible only on focus.
 * - Sound toggle. Sound is on by default; while the browser holds it back ('pending')
 *   the button pulses, and any first click/tap/key on the page turns sound on.
 *   The label names the action: "Mute" while playing sound, "Sound on" otherwise.
 *   Only this button re-renders when the sound state changes.
 */
export default function HeroInteraction({ onTap, onGreet, sound }) {
  const soundState = useSyncExternalStore(sound.subscribe, sound.get, getServerSound)
  const isOn = soundState === 'on'

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onTap}
        className="absolute inset-0 z-10 touch-manipulation select-none [-webkit-tap-highlight-color:transparent]"
      />

      <div className="absolute bottom-5 left-5 z-30">
        <button
          type="button"
          onClick={onGreet}
          className="sr-only inline-flex items-center gap-2 rounded-full bg-blush-100 px-4 py-2 text-sm font-medium text-wine-950 focus-visible:not-sr-only"
        >
          <Hand aria-hidden="true" className="size-4" />
          Say hello to Adrita
        </button>
      </div>

      <button
        type="button"
        onClick={sound.toggle}
        data-sound-toggle=""
        data-sound={soundState}
        className="sound-toggle absolute right-5 bottom-5 z-30 inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-3.5 text-sm font-medium text-white/85 ring-1 ring-white/20 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white max-[379px]:w-10 max-[379px]:justify-center max-[379px]:px-0"
      >
        {isOn ? (
          <VolumeX aria-hidden="true" className="size-4 shrink-0" />
        ) : (
          <Volume2 aria-hidden="true" className="size-4 shrink-0" />
        )}
        <span className="max-[379px]:sr-only">{SOUND_LABEL[soundState]}</span>
      </button>
    </>
  )
}
