-- charinfo script for use with bizhawk while game is running
-- MAKE SURE THE ELECTRON APP IS UP FIRST BEFORE RUNNING IT!

-- character info positions in memory
slot1 = 0xDABC
slot2 = 0xDB20
slot3 = 0xDB84
slot4 = 0xDBE8

function make_details(charname, jobbyte)
  -- TODO: figure out a smarter way to encode JSON
  return '{ "id": "' .. charname .. '", "job": ' .. jobbyte .. ' }'
end

function get_unoccupied()
  return make_details("unoccupied", 42)
end

function get_chardetails(charname, charaddr)
  jobaddr = charaddr + 1
  jobbyte = memory.readbyte(jobaddr)

  return make_details(charname, jobbyte)
end

function get_charnumber(charbyte)
  -- question 1: who is this?
  -- we get this by grabbing
  -- the last three bits of the value
  -- 0b000 -> bartz, 0b001 -> lena, etc

  -- how do we get the last three bits?
  -- we could use a mask!
  last_n_bits = 3
  mask = bit.lshift(1, last_n_bits) - 1  -- equivalent to 0b0111

  -- and then bitwise-and it with the charbyte, e.g.:
  -- console.log(bit.band(136, mask))  -- should be bartz (0)
  -- console.log(bit.band(137, mask))  -- should be lena (1)
  -- console.log(bit.band(138, mask))  -- should be galuf (2)
  -- console.log(bit.band(139, mask))  -- should be faris (3)
  -- console.log(bit.band(140, mask))  -- should be krile (4)

  return bit.band(charbyte, mask)
end

function get_character(charaddr)
  charbyte = memory.readbyte(charaddr)
  charlevel = memory.readbyte(charaddr + 2)
  charnumber = get_charnumber(charbyte)

  if charlevel == 0 then
    -- if charlevel is zero,
    -- assume its freshly-initialized data
    -- and we haven't loaded a save yet
    return get_unoccupied()
  elseif (charbyte >= 64) and (charbyte <= 127) then
    -- if charbyte is between 64 and 127 (inclusive),
    -- then bit #2 is set to 1,
    -- and it's an empty slot
    return get_unoccupied()
  elseif charnumber == 0 then
    return get_chardetails("bartz", charaddr)
  elseif charnumber == 1 then
    return get_chardetails("lena", charaddr)
  elseif charnumber == 2 then
    return get_chardetails("galuf", charaddr)
  elseif charnumber == 3 then
    return get_chardetails("faris", charaddr)
  elseif charnumber == 4 then
    return get_chardetails("krile", charaddr)
  end
end

function should_update()
  frames_per_second = 60  -- assuming the game is running at 60 fps,
  seconds_between_update = 0.5  -- and we want to update every 0.5 seconds,
  every_x_frames = frames_per_second * seconds_between_update  -- report every 60 frames

  current_frame = emu.framecount()

  return (current_frame % every_x_frames == 0)
end

function gameloop()
  if should_update() then
    chars = {
      get_character(slot1),
      get_character(slot2),
      get_character(slot3),
      get_character(slot4)
    }

    party = table.concat(chars, ", ")

    -- TODO: figure out a smarter way to do this.......
    json_payload = "[ " .. party .. " ]"

    comm.httpPost(comm.httpGetPostUrl(), json_payload)
  end
end

-- ensure we're checking Combined WRAM
memory.usememorydomain("Combined WRAM")

-- do this every frame
event.onframestart(gameloop)
