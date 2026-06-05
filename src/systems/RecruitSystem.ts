import { gameState } from '../state/GameState'
import { RECRUITS } from '../data/recruits'

type LoadoutSlot = 'north' | 'south'

// Buying + loadout logic for recruits. Keeps scenes free of ownership rules.
export const RecruitSystem = {
  cost(id: string): number {
    return RECRUITS[id]?.cost ?? 0
  },

  canBuy(id: string): boolean {
    return RECRUITS[id] != null && !gameState.ownsRecruit(id) && gameState.blueMana >= RecruitSystem.cost(id)
  },

  buy(id: string): boolean {
    if (!RecruitSystem.canBuy(id)) return false
    gameState.spendMana(RecruitSystem.cost(id))
    gameState.addRecruit(id)
    return true
  },

  // Assign a recruit to a slot, enforcing that it can't occupy both slots.
  assign(slot: LoadoutSlot, id: string): void {
    if (!gameState.ownsRecruit(id)) return
    const other: LoadoutSlot = slot === 'north' ? 'south' : 'north'
    if (gameState.loadout[other] === id) gameState.setLoadoutSlot(other, null)
    gameState.setLoadoutSlot(slot, id)
  },

  // Remove a recruit from whichever slot(s) hold it.
  unassign(id: string): void {
    if (gameState.loadout.north === id) gameState.setLoadoutSlot('north', null)
    if (gameState.loadout.south === id) gameState.setLoadoutSlot('south', null)
  },
}
