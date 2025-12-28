class Visualizer {

    // Dessine truc dans le style de JoyDivision (la couverture de l'album) https://nouvelle-vague.com/wp-content/uploads/ALBUMDELEGENDE-JOY-DIVISION-Unknown-Pleasures-WEB.jpg
    static joyDivision(ctx, canvas, frequencyDataFrames, startFrame, parameters) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const lineCount = parameters.lineCount;
        const rangeStart = parameters.rangeStart;
        const rangeEnd = parameters.rangeEnd;
        const amplify = parameters.amplify;
        const smoothing = parameters.smoothing;
        const marginX = width * 0.05;
        const marginY = height * 0.05;
        const drawWidth = width - (2 * marginX);
        const drawHeight = height - (2 * marginY);
        const lineSpacing = drawHeight / lineCount;

        const totalFrames = frequencyDataFrames.length;
        for (let i = 0; i < lineCount; i++) {
            const offSet = (i / lineCount) * totalFrames;
            const frameIdx = Math.floor((startFrame + offSet) % totalFrames);
            const rawData = frequencyDataFrames[frameIdx];
            if (!rawData) continue;

            const data = Visualizer.smoothWave(rawData, rangeStart, rangeEnd, smoothing);
            const baselineY = marginY + (i * lineSpacing);

            ctx.beginPath();
            ctx.moveTo(marginX, baselineY);

            for (let j = 0; j < data.length; j++) {
                const x = marginX + (j / (data.length - 1)) * drawWidth;
                const val = data[j] / 255;
                const y = baselineY - val * lineSpacing * amplify;
                ctx.strokeStyle = `rgba(${y * 0.255}, 184, 198, 1)`;
                ctx.lineTo(x, y);
            }

            ctx.lineTo(width - marginX, baselineY);
            ctx.lineTo(width - marginX, baselineY + lineSpacing);
            ctx.lineTo(marginX, baselineY + lineSpacing);
            ctx.closePath();

            ctx.fillStyle = "#000000";
            ctx.fill();

            ctx.lineWidth = 1.5;
            //ctx.strokeStyle = "rgba(50, 184, 198, 1)";
            ctx.stroke();
        }
    }

    // Decoupe les donnees entre range deb et range fin puis lisse les pick pour faire des formes plsu arrondies
    static smoothWave(data, rangeStart, rangeEnd, smoothing) {
        const sliced = data.slice(Math.floor(data.length * rangeStart), Math.floor(data.length * rangeEnd));
        const smoothed = [];
        for (let i = 0; i < sliced.length; i++) {
            let sum = 0;
            let count = 0;
            for (let k = i - smoothing; k <= i + smoothing; k++) {
                if (k >= 0 && k < sliced.length) {
                    sum += sliced[k];
                    count++;
                }
            }
            smoothed.push(sum / count);
        }
        return smoothed;
    }
}