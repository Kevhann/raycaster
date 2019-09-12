import React, { useRef, useState, useEffect } from "react"
import useInterval from "./useInterval"

const Raytracer = () => {
  const house = [
    { x1: 300, y1: 200, x2: 400, y2: 300 },
    { x1: 200, y1: 300, x2: 300, y2: 200 },
    { x1: 220, y1: 280, x2: 220, y2: 400 },
    { x1: 380, y1: 280, x2: 380, y2: 400 },
    { x1: 220, y1: 400, x2: 380, y2: 400 }
  ]
  const [xmouse, setXmouse] = useState()
  const [ymouse, setYmouse] = useState()
  const [rays, setRays] = useState(19)
  const [radius, setRadius] = useState(200)
  const [walls, setWalls] = useState(house)
  const [drawWalls, setDrawWalls] = useState({
    mode: false,
    firstClick: true,
    start: null
  })
  const ref = useRef(null)
  const mouseOffsetX = -9
  const mouseOffsetY = -11

  useEffect(() => {
    window.addEventListener("keydown", keyDownHandler, true)
    return () => {
      window.removeEventListener("keydown", keyDownHandler, true)
    }
  })

  useInterval(() => {
    draw()
  }, 1000 / 60)

  let ctx
  let width = window.innerWidth
  let height = window.innerHeight

  let angle = (Math.PI / rays) * 2

  const draw = () => {
    ctx = ref.current.getContext("2d")
    ctx.clearRect(0, 0, width, height)

    ctx.beginPath()
    walls.forEach(wall => {
      ctx.moveTo(wall.x1, wall.y1)
      ctx.lineTo(wall.x2, wall.y2)
    })

    ctx.moveTo(xmouse, ymouse)
    if (drawWalls.mode) {
      ctx.ellipse(xmouse, ymouse, 3, 3, Math.PI, 0, 2 * Math.PI)
      ctx.fill()
      if (!drawWalls.firstClick) {
        ctx.moveTo(drawWalls.start.x1, drawWalls.start.y1)
        ctx.lineTo(xmouse, ymouse)
      }
    } else {
      drawRays()
    }
    ctx.closePath()
    ctx.stroke()
  }

  const drawRays = () => {
    for (let i = 0; i < rays; i++) {
      let x = Math.sin(angle * i) * radius + xmouse
      let y = Math.cos(angle * i) * radius + ymouse
      ctx.moveTo(xmouse, ymouse)

      let results = []
      for (let j = 0; j < walls.length; j++) {
        let result = collision(x, y, walls[j])
        if (result !== null) {
          results.push(result)
        }
      }
      const shortest = shortestCollision(results)
      if (shortest === -1) {
        ctx.lineTo(x, y)
      } else {
        ctx.lineTo(results[shortest][0], results[shortest][1])
      }
    }
  }

  const shortestCollision = collisions => {
    let shortest = radius
    let shortestIndex = -1
    for (let i = 0; i < collisions.length; i++) {
      const collision = collisions[i]
      const length = Math.sqrt(
        (collision[0] - xmouse) * (collision[0] - xmouse) +
          (collision[1] - ymouse) * (collision[1] - ymouse)
      )

      if (length < shortest) {
        shortest = length
        shortestIndex = i
      }
    }
    return shortestIndex
  }

  const collision = (x, y, wall) => {
    let x1 = xmouse
    let y1 = ymouse
    let x2 = x
    let y2 = y
    let x3 = wall.x1
    let y3 = wall.y1
    let x4 = wall.x2
    let y4 = wall.y2

    // calculate the distance to intersection point
    let denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)

    let uA = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    let uB = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    // if uA and uB are between 0-1, lines are colliding
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
      let xcollision = x1 + uA * (x2 - x1)
      let ycollision = y1 + uA * (y2 - y1)

      return [xcollision, ycollision]
    }
    return null
  }

  const handloMouseMove = event => {
    setXmouse(event.clientX + mouseOffsetX)
    setYmouse(event.clientY + mouseOffsetY)
  }

  const handleMouseDown = event => {
    if (drawWalls.mode) {
      if (drawWalls.firstClick) {
        setDrawWalls({
          ...drawWalls,
          firstClick: false,
          start: {
            x1: event.clientX + mouseOffsetX,
            y1: event.clientY + mouseOffsetY
          }
        })
      } else {
        setWalls(
          walls.concat({
            ...drawWalls.start,
            x2: event.clientX + mouseOffsetX,
            y2: event.clientY + mouseOffsetY
          })
        )
        setDrawWalls({ ...drawWalls, firstClick: true, start: null })
      }
    }
  }

  const keyDownHandler = event => {
    event.preventDefault()
    const keyCode = event.keyCode

    switch (keyCode) {
      case 37:
        if (rays > 1) {
          setRays(rays - 1)
        }
        break
      case 39:
        setRays(rays + 1)
        break
      case 40:
        if (radius > 5) {
          setRadius(radius - 5)
        }
        break
      case 38:
        setRadius(radius + 5)
        break
      case 33:
        setRadius(radius + 25)
        break
      case 34:
        if (radius > 25) {
          setRadius(radius - 25)
        }
        break
      case 68:
        setDrawWalls({ mode: !drawWalls.mode, firstClick: true, start: null })
        break
      case 67:
        setWalls([])
        break
      case 72:
        setWalls(house)
        break
      default:
    }
  }

  return (
    <div>
      <div style={{ position: "absolute" }}>
        <div>
          x: {xmouse} | y: {ymouse}
        </div>
        <div>
          Rays: {rays} | radius: {radius}
        </div>
        <div>Use the arrow keys to change the radius and number of rays</div>
        <div>Press D to toggle between rays and building new walls</div>
        <div>press C to clear walls and H to build the house</div>
      </div>

      <div id="canvas">
        <canvas
          ref={ref}
          width={width}
          height={height}
          onMouseMove={e => handloMouseMove(e)}
          onMouseDown={e => handleMouseDown(e)}
        />
      </div>
    </div>
  )
}
export default Raytracer
