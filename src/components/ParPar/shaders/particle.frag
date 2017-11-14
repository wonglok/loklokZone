varying vec4 parVel;

void main()	{

    vec4 rainbow = parVel;

// 	vec4 outputColor = vec4(
//         (rainbow.x + 0.6),
//         (rainbow.y * rainbow.x + 0.6),
//         (rainbow.y + 0.6),
//         0.25
//     );
    // outputColor.xyz = clamp(outputColor.xyz, vec3(0.0), vec3(1.0));

    vec4 outputColor = vec4(0.5, 0.5, 0.5, 0.25);

    gl_FragColor = outputColor;
}