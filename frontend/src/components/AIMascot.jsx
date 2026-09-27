import React from "react";

const AIMascot = () => {
  return (
    <div className="relative flex h-[540px] w-full items-end justify-center overflow-hidden">

      {/* ================= BACKGROUND GLOW ================= */}

      <div className="
        absolute
        bottom-[-120px]
        left-1/2
        h-[500px]
        w-[500px]
        -translate-x-1/2
        rounded-full
        bg-purple-600/20
        blur-[100px]
      " />

      <div className="
        absolute
        bottom-[-100px]
        left-1/2
        h-[350px]
        w-[350px]
        -translate-x-1/2
        rounded-full
        bg-fuchsia-500/15
        blur-[80px]
      " />

      {/* ================= ORBIT ================= */}

      <div className="
        absolute
        bottom-[40px]
        left-1/2
        h-[220px]
        w-[650px]
        -translate-x-1/2
        rotate-[-12deg]
        rounded-[50%]
        border
        border-purple-500/30
        shadow-[0_0_25px_rgba(139,92,246,0.25)]
        animate-orbit
      " />

      <div className="
        absolute
        bottom-[30px]
        left-1/2
        h-[260px]
        w-[720px]
        -translate-x-1/2
        rotate-[10deg]
        rounded-[50%]
        border
        border-cyan-400/20
        animate-orbit-reverse
      " />

      {/* ================= STARS ================= */}

      <span className="
        absolute
        left-[15%]
        top-[20%]
        text-xl
        text-purple-300
        drop-shadow-[0_0_10px_#a855f7]
        animate-twinkle
      ">
        ✦
      </span>

      <span className="
        absolute
        right-[15%]
        top-[18%]
        text-2xl
        text-fuchsia-300
        drop-shadow-[0_0_10px_#d946ef]
        animate-twinkle
      ">
        ✦
      </span>

      <span className="
        absolute
        left-[22%]
        bottom-[25%]
        text-sm
        text-cyan-300
        animate-twinkle
      ">
        ✦
      </span>

      {/* ================= SPEECH BUBBLE ================= */}

      <div className="
        absolute
        right-[4%]
        top-[18%]
        z-30

        rounded-2xl
        border
        border-purple-400/30
        bg-[#151022]/80
        px-5
        py-3

        text-sm
        font-medium
        text-white

        shadow-[0_0_25px_rgba(168,85,247,0.25)]
        backdrop-blur-md

        animate-speech
      ">

        <span className="text-purple-300">
          Hi! 👋
        </span>

        <br />

        <span className="text-gray-300">
          I'm your Career Twin ✨
        </span>

        {/* bubble tail */}
        <div className="
          absolute
          bottom-[-7px]
          left-7
          h-4
          w-4
          rotate-45
          border-b
          border-r
          border-purple-400/30
          bg-[#151022]
        " />
      </div>


      {/* ================= ROBOT ================= */}

      <div className="
        relative
        z-20

        h-[430px]
        w-[280px]

        animate-robot-enter
      ">

        {/* ================= ANTENNA ================= */}

        <div className="
          absolute
          left-[137px]
          top-[-18px]
          h-[32px]
          w-[4px]
          rounded-full
          bg-gradient-to-t
          from-purple-500
          to-purple-200
        ">

          <div className="
            absolute
            -left-[5px]
            -top-[8px]
            h-[14px]
            w-[14px]
            rounded-full
            bg-purple-400
            shadow-[0_0_18px_#a855f7]
            animate-antenna
          " />

        </div>


        {/* ================= HEAD ================= */}

        <div className="
          absolute
          left-[22px]
          top-[25px]

          h-[175px]
          w-[235px]

          rounded-[48%_48%_45%_45%]

          bg-gradient-to-br
          from-white
          via-[#eeeaff]
          to-[#c4b5fd]

          shadow-[0_0_20px_rgba(167,139,250,0.45)]
        ">

          {/* LEFT EAR */}

          <div className="
            absolute
            -left-[22px]
            top-[43px]
            h-[88px]
            w-[43px]
            rounded-full

            bg-gradient-to-br
            from-[#e9e5ff]
            to-[#a78bfa]

            shadow-[0_0_20px_rgba(139,92,246,0.5)]
          ">

            <div className="
              absolute
              left-[10px]
              top-[14px]
              h-[58px]
              w-[23px]

              rounded-full
              border-[4px]
              border-cyan-300

              shadow-[0_0_12px_#22d3ee]

              animate-ear-glow
            " />

          </div>


          {/* RIGHT EAR */}

          <div className="
            absolute
            -right-[22px]
            top-[43px]
            h-[88px]
            w-[43px]
            rounded-full

            bg-gradient-to-br
            from-[#e9e5ff]
            to-[#a78bfa]

            shadow-[0_0_20px_rgba(139,92,246,0.5)]
          ">

            <div className="
              absolute
              left-[10px]
              top-[14px]
              h-[58px]
              w-[23px]

              rounded-full
              border-[4px]
              border-cyan-300

              shadow-[0_0_12px_#22d3ee]

              animate-ear-glow
            " />

          </div>


          {/* ================= HEAD LEAVES ================= */}

          <div className="
            absolute
            -top-[15px]
            left-[35px]

            h-[30px]
            w-[62px]

            rotate-[20deg]

            rounded-[100%_0_100%_0]

            bg-gradient-to-br
            from-purple-500
            to-fuchsia-300

            shadow-[0_0_15px_rgba(168,85,247,0.4)]
          " />

          <div className="
            absolute
            -top-[13px]
            right-[45px]

            h-[28px]
            w-[50px]

            rotate-[-25deg]

            rounded-[100%_0_100%_0]

            bg-gradient-to-br
            from-purple-500
            to-fuchsia-300
          " />


          {/* ================= FACE ================= */}

          <div className="
            absolute
            left-[33px]
            top-[35px]

            h-[105px]
            w-[170px]

            rounded-[45px]

            bg-[#020712]

            shadow-[inset_0_0_25px_rgba(30,64,175,0.5)]
          ">


            {/* LEFT EYE */}

            <div className="
              absolute
              left-[35px]
              top-[38px]

              h-[17px]
              w-[28px]

              rounded-[50%]

              border-t-[4px]
              border-cyan-300

              shadow-[0_-2px_12px_#22d3ee]

              animate-blink
            " />


            {/* RIGHT EYE */}

            <div className="
              absolute
              right-[35px]
              top-[38px]

              h-[17px]
              w-[28px]

              rounded-[50%]

              border-t-[4px]
              border-cyan-300

              shadow-[0_-2px_12px_#22d3ee]

              animate-blink
            " />


            {/* SMILE */}

            <div className="
              absolute
              left-[73px]
              top-[59px]

              h-[14px]
              w-[25px]

              rounded-b-full

              border-b-[4px]
              border-cyan-300

              shadow-[0_4px_10px_#22d3ee]

              animate-smile
            " />

          </div>

        </div>


        {/* ================= BODY ================= */}

        <div className="
          absolute
          left-[55px]
          top-[180px]

          h-[205px]
          w-[170px]

          rounded-[45%_45%_35%_35%]

          bg-gradient-to-br
          from-white
          via-[#eeeaff]
          to-[#c4b5fd]

          shadow-[0_0_25px_rgba(139,92,246,0.3)]
        ">


          {/* NECK */}

          <div className="
            absolute
            -top-[9px]
            left-[62px]

            h-[20px]
            w-[45px]

            rounded-xl

            bg-gradient-to-r
            from-purple-600
            to-fuchsia-500

            shadow-[0_0_12px_#9333ea]
          " />


          {/* ================= CHEST LOGO ================= */}

          <div className="
            absolute
            left-[35px]
            top-[30px]

            flex
            h-[100px]
            w-[100px]

            items-center
            justify-center

            rounded-full

            bg-white/30
          ">

            <div className="
              relative
              h-[42px]
              w-[42px]
              rotate-45
            ">

              <span className="
                absolute
                left-0
                top-0
                h-[19px]
                w-[19px]
                rounded-[70%_30%_70%_30%]
                bg-purple-600
                shadow-[0_0_12px_#9333ea]
              " />

              <span className="
                absolute
                right-0
                top-0
                h-[19px]
                w-[19px]
                rounded-[70%_30%_70%_30%]
                bg-purple-600
                shadow-[0_0_12px_#9333ea]
              " />

              <span className="
                absolute
                bottom-0
                left-0
                h-[19px]
                w-[19px]
                rounded-[70%_30%_70%_30%]
                bg-purple-600
                shadow-[0_0_12px_#9333ea]
              " />

              <span className="
                absolute
                bottom-0
                right-0
                h-[19px]
                w-[19px]
                rounded-[70%_30%_70%_30%]
                bg-purple-600
                shadow-[0_0_12px_#9333ea]
              " />

            </div>

          </div>


          {/* ================= LEFT ARM ================= */}

          <div className="
            absolute
            -left-[22px]
            top-[35px]

            h-[100px]
            w-[27px]

            rotate-[15deg]

            rounded-full

            bg-gradient-to-r
            from-[#c4b5fd]
            to-white
          ">

            <div className="
              absolute
              -bottom-[23px]
              -left-[6px]

              h-[38px]
              w-[38px]

              rounded-full

              bg-white

              shadow-[0_0_12px_rgba(139,92,246,0.2)]
            " />

          </div>


          {/* ================= RIGHT WAVING ARM ================= */}

          <div className="
            absolute
            -right-[22px]
            top-[5px]

            h-[100px]
            w-[27px]

            rotate-[-45deg]

            rounded-full

            bg-gradient-to-r
            from-[#c4b5fd]
            to-white

            animate-wave
          ">

            <div className="
              absolute
              -bottom-[23px]
              -left-[6px]

              h-[38px]
              w-[38px]

              rounded-full

              bg-white

              shadow-[0_0_15px_rgba(139,92,246,0.25)]
            ">

              {/* Fingers */}

              <span className="
                absolute
                -top-[14px]
                left-[4px]
                h-[25px]
                w-[9px]
                rotate-[-25deg]
                rounded-full
                bg-white
              " />

              <span className="
                absolute
                -top-[16px]
                left-[12px]
                h-[27px]
                w-[9px]
                rotate-[-5deg]
                rounded-full
                bg-white
              " />

              <span className="
                absolute
                -top-[14px]
                left-[20px]
                h-[25px]
                w-[9px]
                rotate-[10deg]
                rounded-full
                bg-white
              " />

              <span className="
                absolute
                -top-[10px]
                left-[28px]
                h-[21px]
                w-[9px]
                rotate-[25deg]
                rounded-full
                bg-white
              " />

            </div>

          </div>


          {/* ================= LEGS ================= */}

          <div className="
            absolute
            -bottom-[40px]
            left-[38px]

            h-[62px]
            w-[35px]

            rotate-[12deg]

            rounded-full

            bg-gradient-to-r
            from-[#aaa5ff]
            to-white
          " />

          <div className="
            absolute
            -bottom-[40px]
            right-[38px]

            h-[62px]
            w-[35px]

            rotate-[-12deg]

            rounded-full

            bg-gradient-to-r
            from-[#aaa5ff]
            to-white
          " />

        </div>

      </div>

    </div>
  );
};

export default AIMascot;
