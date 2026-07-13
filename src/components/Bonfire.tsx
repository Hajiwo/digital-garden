export default function Bonfire() {
  return <div className="bonfire" aria-hidden="true">
    <div className="bonfire-aura" />
    <div className="embers"><i /><i /><i /><i /><i /><i /></div>
    <div className="flames"><span className="flame flame-back" /><span className="flame flame-left" /><span className="flame flame-main" /><span className="flame flame-core" /><span className="flame flame-right" /></div>
    <div className="bonfire-sword"><span className="sword-pommel" /><span className="sword-grip" /><span className="sword-guard" /><span className="sword-blade" /></div>
    <div className="bonfire-logs"><span /><span /><i /><i /><i /></div>
  </div>
}
