var THREE = window.THREE

import setupEvents from './events.js';

export function makeAPI () {
    var api = {}

    var WIDTH = 128

    api.eventStack = {};
    api.setup = ({ target }) => {
        var renderer = new THREE.WebGLRenderer({ alpha: true })
        api.compute = setupCompute({ renderer })
        api.render = setupRender({ renderer, target })
        api.events = setupEvents({ target, stack: api.eventStack })
        api.loop = setupLoop()
    }

    api.clean = () => {
        api.loop.stop()
    }

    var setupLoop = () => {
        var rAF = () => {
            api.rAFID = window.requestAnimationFrame(rAF)

            var result = api.compute.run()
            api.render.run({ compute: result })
        }
        api.rAFID = window.requestAnimationFrame(rAF)

        return {
            stop () {
                window.cancelAnimationFrame(api.rAFID)
            }
        }
    }

    var makeAnimatable = ({ scene }) => {

        var geometry = new THREE.PlaneBufferGeometry(30, 30, WIDTH - 1, WIDTH - 1);
    	var material = new THREE.ShaderMaterial({
    	    blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
    	    vertexShader: require('./funz/particle.vert'),
    	    fragmentShader: require('./funz/particle.frag'),
    	    uniforms: {
    	        pointSize: { value: window.devicePixelRatio || 1.0 },
                posTex: { value: null },
    	        velTex: { value: null }
    	    }
    	})

    	var points = new THREE.Points(geometry, material)
    	points.matrixAutoUpdate = false
        points.updateMatrix()

    	scene.add(points)

    	return {
    	    material,
    	    points
    	}
    }

    var setupRender = ({ renderer, target }) => {
        var mod = {}

        var scene = new THREE.Scene();
    	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.01, 1000 );
        camera.position.z = 165;

        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.setPixelRatio(window.devicePixelRatio || 1.0)
        target.appendChild(renderer.domElement);
    	renderer.domElement.style.marginBottom = '-6px'

    	api.eventStack.setSize = ({ type, rect, aspect }) => {
            if (type === 'resize' && rect) {
                renderer.setSize(rect.width, rect.height)
                camera.aspect = aspect;
                camera.updateProjectionMatrix()
            }
        }

    	scene.background = new THREE.Color(0x000000);

        var anim = makeAnimatable({ scene })

    	mod.run = () => {
    	    var { velTex, posTex } = api.compute.getTex()

    	    anim.material.uniforms.posTex.value = posTex
    	    anim.material.uniforms.velTex.value = velTex

            renderer.render( scene, camera );
        }

        return mod
    }



    var setupCompute = ({ renderer }) => {
        var mod = {}

        function fillTexture (texture, WIDTH) {

            var pixels = texture.image.data
            var p = 0
            for (var j = 0; j < WIDTH; j++) {
                for (var i = 0; i < WIDTH; i++) {
                    var x = (WIDTH / 2 - i) * 128 / WIDTH
                    var y = (WIDTH / 2 - j) * 128 / WIDTH

                    pixels[ p + 0 ] = x
                    pixels[ p + 1 ] = y

                    pixels[ p + 2 ] = 0// noise(Math.sin(x), Math.sin(y), 0.0)
                    pixels[ p + 3 ] = 0
                    p += 4
                }
            }
        }

        var gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );

        // Create initial state float textures
        var pos0 = gpuCompute.createTexture();
        var vel0 = gpuCompute.createTexture();
        // and fill in here the texture data...
        fillTexture(pos0, WIDTH)

        // Add texture variables
        var velVar = gpuCompute.addVariable( 'velTex', require('./funz/velocitySim.frag'), pos0 );
        var posVar = gpuCompute.addVariable( 'posTex', require('./funz/positionSim.frag'), vel0 );

        // Add variable dependencies
        gpuCompute.setVariableDependencies( velVar, [ velVar, posVar ] );
        gpuCompute.setVariableDependencies( posVar, [ velVar, posVar ] );

        // Add custom uniforms
        velVar.material.uniforms = {
            time: { value: 0.0 },
            mouse: { value: new THREE.Vector2(0,0) }
        }

        api.eventStack.mousePos = ({ type, pageX, pageY, rect }) => {
            var velocity = velVar.material.uniforms.mouse.value;
            if (type === 'mv' && rect) {
                velocity.x = ((pageX - rect.left) / rect.width) * 2 - 1
                velocity.y = -((pageY - rect.top) / rect.height) * 2 + 1
            } else if (type === 'tm' && rect) {
                velocity.x = ((pageX - rect.left) / rect.width) * 2 - 1
                velocity.y = -((pageY - rect.top) / rect.height) * 2 + 1
            }
        }

        // Check for completeness
        var error = gpuCompute.init();
        if ( error !== null ) {
            alert(error);
            console.error( error );
        }
        mod.getTex = () => {
            return {
                velTex: gpuCompute.getCurrentRenderTarget(velVar).texture,
                posTex: gpuCompute.getCurrentRenderTarget(posVar).texture
            }
        };

        mod.run = () => {
            velVar.material.uniforms.time.value = window.performance.now() / 1000
            gpuCompute.compute();
        }
        return mod
    }


    return api;
}
